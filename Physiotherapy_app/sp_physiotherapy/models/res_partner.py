# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology (<>).
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

import re
from datetime import date

from dateutil.relativedelta import relativedelta

from odoo import api, fields, models, _
from odoo.exceptions import ValidationError


class ResPartner(models.Model):
    """Extend res.partner to support patient management."""

    _inherit = "res.partner"

    # ------------------------------------------------------------------
    # Fields -- Role
    # ------------------------------------------------------------------

    is_patient = fields.Boolean(
        string="Is a Patient",
        default=False,
        index=True,
    )

    patient_code = fields.Char(
        string="Patient ID",
        copy=False,
        index=True,
        readonly=True,
        help="Auto-generated unique patient identifier.",
    )

    # ------------------------------------------------------------------
    # Fields -- Demographics
    # ------------------------------------------------------------------

    date_of_birth = fields.Date(
        string="Date of Birth",
    )

    age = fields.Integer(
        string="Age",
        compute="_compute_age",
        store=True,
        help="Computed from date of birth.",
    )

    gender = fields.Selection(
        selection=[
            ("male", "Male"),
            ("female", "Female"),
            ("other", "Other"),
        ],
        string="Gender",
    )

    blood_group = fields.Selection(
        selection=[
            ("a+", "A+"),
            ("a-", "A-"),
            ("b+", "B+"),
            ("b-", "B-"),
            ("o+", "O+"),
            ("o-", "O-"),
            ("ab+", "AB+"),
            ("ab-", "AB-"),
        ],
        string="Blood Group",
    )

    # ------------------------------------------------------------------
    # Fields -- Medical
    # ------------------------------------------------------------------

    medical_history = fields.Text(
        string="Medical History",
    )

    allergies = fields.Text(
        string="Allergies",
    )

    emergency_contact_name = fields.Char(
        string="Emergency Contact Name",
    )

    emergency_contact_phone = fields.Char(
        string="Emergency Contact Phone",
    )

    source_id = fields.Many2one(
        comodel_name="medical.source",
        string="Referral Source",
        ondelete="set null",
        help="How the patient learned about the clinic.",
    )

    medical_questionnaire_ids = fields.One2many(
        comodel_name="medical.questionnaire",
        inverse_name="patient_id",
        string="Medical Questionnaires",
    )

    xray_report_ids = fields.One2many(
        comodel_name="xray.report",
        inverse_name="patient_id",
        string="X-Ray Reports",
    )

    # ------------------------------------------------------------------
    # Fields -- Smart-button counts
    # ------------------------------------------------------------------

    appointment_count = fields.Integer(
        string="Appointments",
        compute="_compute_appointment_count",
    )

    prescription_count = fields.Integer(
        string="Prescriptions",
        compute="_compute_prescription_count",
    )

    bill_count = fields.Integer(
        string="Bills",
        compute="_compute_bill_count",
    )

    # ------------------------------------------------------------------
    # SQL constraints
    # ------------------------------------------------------------------

    _patient_code_unique = models.Constraint(
        "UNIQUE(patient_code)",
        "Patient ID must be unique.",
    )

    # ------------------------------------------------------------------
    # Compute -- age
    # ------------------------------------------------------------------

    @api.depends("date_of_birth")
    def _compute_age(self):
        today = date.today()
        for partner in self:
            if partner.date_of_birth:
                partner.age = relativedelta(
                    today, partner.date_of_birth
                ).years
            else:
                partner.age = 0

    # ------------------------------------------------------------------
    # Compute -- smart-button counts (batch via read_group)
    # ------------------------------------------------------------------

    # AFTER — Odoo 19 standard _read_group for all three

    def _compute_appointment_count(self):
        if not self.ids:
            self.appointment_count = 0
            return
        groups = self.env["medical.appointment"]._read_group(
            domain=[("patient_id", "in", self.ids)],
            groupby=["patient_id"],
            aggregates=["__count"],
        )
        mapped = {partner.id: count for partner, count in groups}
        for partner in self:
            partner.appointment_count = mapped.get(partner.id, 0)

    def _compute_prescription_count(self):
        if not self.ids:
            self.prescription_count = 0
            return
        groups = self.env["medical.prescription"]._read_group(
            domain=[("patient_id", "in", self.ids)],
            groupby=["patient_id"],
            aggregates=["__count"],
        )
        mapped = {partner.id: count for partner, count in groups}
        for partner in self:
            partner.prescription_count = mapped.get(partner.id, 0)

    def _compute_bill_count(self):
        if not self.ids:
            self.bill_count = 0
            return
        groups = self.env["account.move"]._read_group(
            domain=[
                ("partner_id", "in", self.ids),
                ("move_type", "=", "out_invoice"),
            ],
            groupby=["partner_id"],
            aggregates=["__count"],
        )
        mapped = {partner.id: count for partner, count in groups}
        for partner in self:
            partner.bill_count = mapped.get(partner.id, 0)

    # ------------------------------------------------------------------
    # Compute -- display name
    # ------------------------------------------------------------------

    @api.depends(
        "complete_name",
        "email",
        "vat",
        "state_id",
        "country_id",
        "commercial_company_name",
        "patient_code",
    )
    @api.depends_context(
        "show_address",
        "partner_show_db_id",
        "address_inline",
        "show_email",
        "show_vat",
        "lang",
    )
    def _compute_display_name(self):
        ctx = self.env.context
        for partner in self:
            name = partner.with_context(
                lang=ctx.get("lang")
            )._get_complete_name()

            if partner.patient_code:
                name = "%s - %s" % (
                    partner.patient_code,
                    name,
                )

            if ctx.get("show_address"):
                name = (
                        name
                        + "\n"
                        + partner._display_address(
                    without_company=True
                )
                )

            name = re.sub(r"\s+\n", "\n", name)

            if ctx.get("partner_show_db_id"):
                name = "%s (%s)" % (name, partner.id)

            if ctx.get("address_inline"):
                name = ", ".join(
                    part.strip()
                    for part in name.split("\n")
                    if part.strip()
                )

            if ctx.get("show_email") and partner.email:
                name = "%s <%s>" % (name, partner.email)

            if ctx.get("show_vat") and partner.vat:
                name = "%s - %s" % (name, partner.vat)

            partner.display_name = name.strip()

    # ------------------------------------------------------------------
    # Name search
    # ------------------------------------------------------------------

    @api.model
    def name_search(
            self, name, args=None, operator="ilike", limit=100
    ):
        """Allow searching patients by patient_code."""
        args = args or []
        if name:
            args = args + [
                "|",
                ("name", operator, name),
                ("patient_code", operator, name),
            ]
        return super().name_search(
            name, args, operator, limit
        )

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if (
                    vals.get("is_patient")
                    and not vals.get("patient_code")
            ):
                vals["patient_code"] = (
                        self.env["ir.sequence"].next_by_code(
                            "medical.patient"
                        )
                        or "PAT/NEW"
                )
        records = super().create(vals_list)
        for rec in records:
            if rec.is_patient and rec.email:
                rec._assign_portal_user()
        return records

    def write(self, vals):
        res = super().write(vals)
        if vals.get("is_patient"):
            for rec in self:
                if rec.is_patient and not rec.patient_code:
                    rec.patient_code = (
                            self.env[
                                "ir.sequence"
                            ].next_by_code("medical.patient")
                            or "PAT/NEW"
                    )
        return res

    # ------------------------------------------------------------------
    # Constraints
    # ------------------------------------------------------------------

    @api.constrains("is_patient", "email")
    def _check_patient_email(self):
        for rec in self:
            if rec.is_patient and not rec.email:
                raise ValidationError(
                    _(
                        "Patient '%(name)s' must have an "
                        "email address for portal access.",
                        name=rec.name,
                    )
                )

    @api.constrains("date_of_birth")
    def _check_date_of_birth(self):
        for rec in self:
            if (
                    rec.date_of_birth
                    and rec.date_of_birth > fields.Date.today()
            ):
                raise ValidationError(
                    _(
                        "Date of birth cannot be in "
                        "the future."
                    )
                )

    # ------------------------------------------------------------------
    # Portal user helper
    # ------------------------------------------------------------------

    def _assign_portal_user(self):
        """Create a portal user for the patient partner.

        Checks for an existing user linked to this partner
        first, then falls back to a login/email lookup to
        avoid duplicates.
        """
        self.ensure_one()
        if not self.email:
            return

        Users = self.env["res.users"].sudo()
        portal_group = self.env.ref("base.group_portal")

        existing = Users.search(
            [("partner_id", "=", self.id)], limit=1
        )
        if existing:
            existing.write(
                {"group_ids": [(4, portal_group.id)]}
            )
            return

        existing_by_login = Users.search(
            [("login", "=", self.email)], limit=1
        )
        if existing_by_login:
            existing_by_login.write({
                "partner_id": self.id,
                "group_ids": [(4, portal_group.id)],
            })
            return

        Users.create({
            "name": self.name,
            "login": self.email,
            "partner_id": self.id,
            "group_ids": [(6, 0, [portal_group.id])],
        })

    # ------------------------------------------------------------------
    # Actions (smart buttons)
    # ------------------------------------------------------------------

    def action_open_appointments(self):
        """Open appointments for this patient."""
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": _("Appointments"),
            "res_model": "medical.appointment",
            "view_mode": "list,form,calendar",
            "domain": [("patient_id", "=", self.id)],
            "context": {
                "default_patient_id": self.id,
            },
        }

    def action_open_prescriptions(self):
        """Open prescriptions for this patient."""
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": _("Prescriptions"),
            "res_model": "medical.prescription",
            "view_mode": "list,form",
            "domain": [("patient_id", "=", self.id)],
            "context": {
                "default_patient_id": self.id,
            },
        }

    def action_open_bills(self):
        """Open invoices for this patient."""
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": _("Invoices"),
            "res_model": "account.move",
            "view_mode": "list,form",
            "domain": [
                ("partner_id", "=", self.id),
                ("move_type", "=", "out_invoice"),
            ],
            "context": {
                "default_partner_id": self.id,
                "default_move_type": "out_invoice",
            },
        }

    def action_open_payments(self):
        """Open payments for this patient."""
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": _("Payments"),
            "res_model": "account.payment",
            "view_mode": "list,form",
            "domain": [
                ("partner_id", "=", self.id),
            ],
            "context": {
                "default_partner_id": self.id,
            },
        }
