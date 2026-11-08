# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology (<>).
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

import pytz

from odoo import api, fields, models, _
from odoo.exceptions import UserError


class MedicalPrescription(models.Model):
    """Medical prescription issued after a patient
    appointment in the physiotherapy clinic."""

    _name = "medical.prescription"
    _description = "Medical Prescription"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _rec_name = "sequence_no"
    _order = "prescription_date desc, id desc"


    sequence_no = fields.Char(
        string="Prescription No.",
        required=True,
        readonly=True,
        copy=False,
        default=lambda self: _("New"),
    )

    appointment_id = fields.Many2one(
        comodel_name="medical.appointment",
        string="Appointment",
        required=True,
        domain="[('state', '=', 'done')]",
        ondelete="restrict",
    )

    patient_id = fields.Many2one(
        comodel_name="res.partner",
        string="Patient",
        related="appointment_id.patient_id",
        store=True,
        readonly=True,
    )

    prescribed_doctor_id = fields.Many2one(
        comodel_name="hr.employee",
        string="Prescribed Doctor",
        related="appointment_id.doctor_id",
        store=True,
        readonly=True,
    )

    treatment_id = fields.Many2one(
        comodel_name="medical.treatment",
        string="Treatment",
        ondelete="set null",
    )

    treatment_cost = fields.Float(
        string="Treatment Cost",
        related="treatment_id.cost",
        readonly=True,
    )

    currency_id = fields.Many2one(
        comodel_name="res.currency",
        string="Currency",
        default=lambda self: (
            self.env.user.company_id.currency_id
        ),
        required=True,
    )

    prescription_date = fields.Date(
        string="Prescription Date",
        default=fields.Date.today,
        required=True,
    )

    state = fields.Selection(
        selection=[
            ("new", "New"),
            ("prescribed", "Prescribed"),
            ("invoiced", "Invoiced"),
        ],
        string="Status",
        default="new",
        tracking=True,
    )

    medicine_line_ids = fields.One2many(
        comodel_name="medical.prescription.line",
        inverse_name="prescription_id",
        string="Prescribed Medicines",
    )

    treatment_invoice_id = fields.Many2one(
        comodel_name="account.move",
        string="Treatment Invoice",
        readonly=True,
        copy=False,
        ondelete="set null",
    )

    medicine_invoice_id = fields.Many2one(
        comodel_name="account.move",
        string="Medicine Invoice",
        readonly=True,
        copy=False,
        ondelete="set null",
    )

    referred_doctor_id = fields.Many2one(
        comodel_name="hr.employee",
        string="Referred Doctor",
        domain="[('is_doctor', '=', True)]",
        ondelete="set null",
    )

    next_appointment_date = fields.Datetime(
        string="Follow-up Date",
    )

    notes = fields.Text(
        string="Prescription Notes",
    )


    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get("sequence_no", _("New")) == _("New"):
                vals["sequence_no"] = (
                    self.env["ir.sequence"].next_by_code(
                        "medical.prescriptions"
                    )
                    or _("New")
                )
        records = super().create(vals_list)
        for record in records:
            if record.next_appointment_date:
                record._create_followup_appointment()
        return records

    def write(self, vals):
        res = super().write(vals)
        if "next_appointment_date" in vals:
            for record in self:
                if record.next_appointment_date:
                    record._create_followup_appointment()
        return res

    def _create_followup_appointment(self):
        """Create a follow-up appointment with automatic shift
        selection based on the scheduled date/time."""
        self.ensure_one()
        if not self.next_appointment_date or not self.patient_id:
            return

        doctor = (
            self.referred_doctor_id or self.prescribed_doctor_id
        )
        if not doctor:
            return

        user_tz = pytz.timezone(self.env.user.tz or "UTC")
        appt_dt = self.next_appointment_date
        if appt_dt.tzinfo is None:
            appt_dt = pytz.UTC.localize(appt_dt)

        local_dt = appt_dt.astimezone(user_tz)
        appt_time = (
            local_dt.hour + local_dt.minute / 60.0
        )

        selected_shift = False
        for shift in doctor.time_shift_ids:
            start = self._normalize_float_time(
                shift.start_time
            )
            end = self._normalize_float_time(
                shift.end_time
            )
            check = appt_time

            if end <= start:
                end += 24
                if check < start:
                    check += 24

            if start <= check <= end:
                selected_shift = shift
                break

        if not selected_shift:
            raise UserError(
                _(
                    "Appointment time %s is outside "
                    "the doctor's working hours."
                )
                % self._float_to_time_string(appt_time)
            )

        Appointment = self.env["medical.appointment"]
        Appointment._validate_doctor_time_rules(
            appointment_date=self.next_appointment_date,
            doctor_id=doctor.id,
            shift_id=selected_shift.id,
            exclude_id=False,
        )

        Appointment.create({
            "patient_id": self.patient_id.id,
            "appointment_date": self.next_appointment_date,
            "doctor_id": doctor.id,
            "shift_id": selected_shift.id,
            "state": "draft",
        })

    # ----------------------------------------------------------
    # Actions
    # ----------------------------------------------------------

    def action_mark_prescribed(self):
        """Mark the prescription as prescribed and set the
        associated appointment to done."""
        for record in self:
            record.state = "prescribed"
            record.appointment_id.state = "done"

    def action_create_invoices(self):
        """Create separate invoices for treatment and
        prescribed medicines, then mark as invoiced."""
        self.ensure_one()

        if not self.treatment_id:
            raise UserError(
                _("Please select a treatment before "
                  "creating invoices.")
            )

        payment_term = (
            self.patient_id.property_payment_term_id
            or self.env["account.payment.term"].search([], limit=1)
        )
        payment_term_id = payment_term.id if payment_term else False

        treatment_invoice = self.env["account.move"].create({
            "move_type": "out_invoice",
            "partner_id": self.patient_id.id,
            "invoice_date": fields.Date.today(),
            "invoice_payment_term_id": payment_term_id,
            "is_treatment_invoice": True,
            "invoice_line_ids": [
                fields.Command.create({
                    "name": self.treatment_id.name,
                    "quantity": 1,
                    "price_unit": self.treatment_cost,
                }),
            ],
        })

        medicine_lines = []
        stock_moves = []
        for line in self.medicine_line_ids:
            product = self.env["product.product"].search(
                [
                    (
                        "product_tmpl_id",
                        "=",
                        line.medicament_id.id,
                    ),
                ],
                limit=1,
            )
            if not product:
                continue

            medicine_lines.append(
                fields.Command.create({
                    "product_id": product.id,
                    "name": line.display_name,
                    "quantity": line.quantity,
                    "price_unit": line.unit_price,
                })
            )

            if product.type == "consu":
                stock_moves.append({
                    "product": product,
                    "qty": line.quantity,
                })

        if not medicine_lines:
            raise UserError(
                _("No valid medicines to invoice.")
            )

        medicine_invoice = self.env["account.move"].create({
            "move_type": "out_invoice",
            "partner_id": self.patient_id.id,
            "invoice_date": fields.Date.today(),
            "invoice_payment_term_id": payment_term_id,
            "invoice_line_ids": medicine_lines,
        })

        if stock_moves:
            self._create_stock_moves(stock_moves)

        self.treatment_invoice_id = treatment_invoice
        self.medicine_invoice_id = medicine_invoice
        self.state = "invoiced"

        return self.action_view_invoices()

    def _create_stock_moves(self, move_data):
        """Create stock.move records for consumable
        medicines dispensed to the patient."""
        warehouse = self.env["stock.warehouse"].search(
            [("company_id", "=", self.env.company.id)],
            limit=1,
        )
        if not warehouse:
            raise UserError(
                _(
                    "No warehouse found for the current "
                    "company. Please configure a warehouse."
                )
            )

        source_loc = warehouse.lot_stock_id
        customer_loc = self.env.ref(
            "stock.stock_location_customers"
        )

        for item in move_data:
            product = item["product"]
            self.env["stock.move"].create({
                "origin": (
                    "Prescription %s" % self.sequence_no
                ),
                "product_id": product.id,
                "product_uom_qty": item["qty"],
                "quantity": item["qty"],
                "product_uom": product.uom_id.id,
                "location_id": source_loc.id,
                "location_dest_id": customer_loc.id,
                "state": "done",
            })

    def action_view_invoices(self):
        """Open a list of invoices linked to this
        prescription (treatment + medicine)."""
        self.ensure_one()
        invoice_ids = []
        if self.treatment_invoice_id:
            invoice_ids.append(
                self.treatment_invoice_id.id
            )
        if self.medicine_invoice_id:
            invoice_ids.append(
                self.medicine_invoice_id.id
            )

        if len(invoice_ids) == 1:
            return {
                "type": "ir.actions.act_window",
                "name": _("Invoice"),
                "res_model": "account.move",
                "view_mode": "form",
                "res_id": invoice_ids[0],
                "context": {
                    "move_type": "out_invoice",
                },
            }

        return {
            "type": "ir.actions.act_window",
            "name": _("Invoices"),
            "res_model": "account.move",
            "view_mode": "list,form",
            "domain": [("id", "in", invoice_ids)],
            "context": {
                "move_type": "out_invoice",
            },
        }

    def action_print_prescription(self):
        """Print the prescription PDF report."""
        return self.env.ref(
            "sp_physiotherapy."
            "action_report_prescription"
        ).report_action(self.id)

    def action_open_payments(self):
        """Open payment records for the patient linked
        to this prescription."""
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": _("Payments"),
            "res_model": "account.payment",
            "view_mode": "list,form",
            "domain": [
                ("partner_id", "=", self.patient_id.id),
            ],
            "context": {
                "default_partner_id": self.patient_id.id,
            },
        }

    # ----------------------------------------------------------
    # Helpers
    # ----------------------------------------------------------

    @staticmethod
    def _normalize_float_time(value):
        """Normalize float time where minutes are stored
        as decimal fraction.

        Example: 9.30 (meaning 9h 30m) becomes 9.5.
        """
        return int(value) + (value % 1) * 100 / 60

    @staticmethod
    def _float_to_time_string(float_time):
        """Convert a decimal-hours float to a 12-hour
        time string.

        Example: 14.5 becomes '2:30 PM'.
        """
        hours = int(float_time)
        minutes = int(round((float_time - hours) * 60))

        if minutes == 60:
            hours += 1
            minutes = 0

        suffix = "AM" if hours < 12 else "PM"
        display_hour = hours % 12 or 12
        return "%d:%02d %s" % (
            display_hour,
            minutes,
            suffix,
        )


class MedicalPrescriptionLine(models.Model):
    """Individual medicine line within a prescription."""

    _name = "medical.prescription.line"
    _description = "Prescription Line"
    _rec_name = "medicament_id"

    prescription_id = fields.Many2one(
        comodel_name="medical.prescription",
        string="Prescription",
        required=True,
        ondelete="cascade",
    )

    medicament_id = fields.Many2one(
        comodel_name="product.template",
        string="Medicine",
        domain="[('is_medicine', '=', True)]",
        required=True,
    )

    generic_name = fields.Char(
        string="Generic Name",
        related="medicament_id.generic_name",
        readonly=True,
    )

    dosage_strength = fields.Integer(
        string="Dosage Strength",
        related="medicament_id.dosage_strength",
        readonly=True,
    )

    form = fields.Selection(
        selection=[
            ("tablet", "Tablet"),
            ("capsule", "Capsule"),
            ("liquid", "Liquid"),
            ("injection", "Injection"),
            ("ointment", "Ointment"),
        ],
        string="Form",
        required=True,
    )

    quantity = fields.Integer(
        string="Quantity",
        required=True,
        default=1,
    )

    unit_price = fields.Float(
        string="Unit Price",
        related="medicament_id.list_price",
        readonly=True,
    )

    morning = fields.Boolean(
        string="Morning",
    )

    afternoon = fields.Boolean(
        string="Afternoon",
    )

    evening = fields.Boolean(
        string="Evening",
    )

    night = fields.Boolean(
        string="Night",
    )

    before_food = fields.Boolean(
        string="Before Food",
        default=False,
    )

    duration_days = fields.Integer(
        string="Duration (Days)",
    )
