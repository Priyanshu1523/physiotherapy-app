# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology (<>).
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

import base64
import logging
from datetime import timedelta
from io import BytesIO

import pytz
import qrcode

from odoo import _, api, fields, models
from odoo.exceptions import UserError, ValidationError

_logger = logging.getLogger(__name__)


class MedicalAppointment(models.Model):
    _name = "medical.appointment"
    _description = "Medical Appointment"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "id desc"

    patient_id = fields.Many2one(
        "res.partner",
        string="Patient",
        required=True,
        domain="[('is_patient', '=', True)]",
        ondelete="restrict",
    )
    responsible_user = fields.Char(
        string="Responsible",
        default=lambda self: self.env.user.name,
    )
    patient_code = fields.Char(
        string="Patient Code",
        help="Patient ID for quick lookup",
    )
    gender = fields.Selection(
        [
            ("male", "Male"),
            ("female", "Female"),
            ("other", "Other"),
        ],
        string="Gender",
    )
    age = fields.Integer(string="Age")
    phone = fields.Char(related="patient_id.phone",string="Phone",store=True)
    email = fields.Char(
        related="patient_id.email",
        string="Email",
        store=True,
    )
    appointment_no = fields.Char(
        string="Appointment No.",
        readonly=True,
        copy=False,
        index=True,
    )
    appointment_date = fields.Datetime(
        string="Appointment Date",
        required=True,
        tracking=True,
        help="Date and time of the scheduled appointment",
    )
    appointment_end = fields.Datetime(
        string="Appointment End",
        compute="_compute_appointment_end",
        store=True,
    )
    urgency = fields.Selection(
        [
            ("normal", "Normal"),
            ("urgent", "Urgent"),
        ],
        string="Urgency",
        default="normal",
    )
    patient_category = fields.Selection(
        [
            ("existing", "Existing"),
            ("new", "New"),
        ],
        string="Patient Category",
    )
    treatment_category_ids = fields.Many2many(
        "treatment.category",
        string="Treatment Categories",
    )
    slot_duration = fields.Selection(
        [
            ("15", "15 Minutes"),
            ("30", "30 Minutes"),
            ("60", "1 Hour"),
            ("120", "2 Hours"),
        ],
        string="Slot Duration",
        default="30",
        required=True,
    )
    doctor_id = fields.Many2one(
        "hr.employee",
        string="Doctor",
        required=True,
        domain="[('is_doctor', '=', True)]",
        ondelete="restrict",
    )
    state = fields.Selection(
        [
            ("draft", "Draft"),
            ("confirmed", "Confirmed"),
            ("in_progress", "In Progress"),
            ("done", "Done"),
            ("cancelled", "Cancelled"),
        ],
        string="Status",
        default="draft",
        tracking=True,
    )
    available_shift_ids = fields.Many2many(
        "medical.time.shift",
        "medical_appointment_available_shift_rel",
        "appointment_id",
        "shift_id",
        string="Available Shifts",
        compute="_compute_available_shifts",
        store=True,
        compute_sudo=True,
    )
    shift_id = fields.Many2one(
        "medical.time.shift",
        string="Time Shift",
        domain="[('id', 'in', available_shift_ids)]",
        ondelete="restrict",
    )
    invoice_id = fields.Many2one(
        "account.move",
        string="Invoice",
        readonly=True,
        copy=False,
        ondelete="set null",
    )
    invoice_count = fields.Integer(
        string="Invoice Count",
        compute="_compute_invoice_count",
        # store=True removed: depends only on appointment_no which
        # does not change when a new account.move is created, so
        # storing the value causes the smart button to show stale
        # counts.  Non-stored fields recompute on every read.
    )
    consultation_fee = fields.Float(
        string="Consultation Fee",
        help="Fee charged for this consultation",
    )
    booking_qr = fields.Binary(
        string="Booking QR Code",
        compute="_compute_qr_codes",
        store=True,
    )
    appointment_qr = fields.Binary(
        string="Appointment QR Code",
        compute="_compute_qr_codes",
        store=True,
    )
    zoom_meeting_url = fields.Char(
        string="Video Consultation Link",
        readonly=True,
        copy=False,
    )
    zoom_meeting_id = fields.Char(
        string="Meeting ID",
        readonly=True,
        copy=False,
    )
    notes = fields.Text(string="Clinical Notes")

    _appointment_no_unique = models.Constraint(
        "UNIQUE(appointment_no)",
        "Appointment number must be unique.",
    )

    # ------------------------------------------------------------------
    # Constraints
    # ------------------------------------------------------------------

    @api.constrains("appointment_date")
    def _check_past_date(self):
        """Prevent creating appointments in the past.

        Editing an existing record is allowed so that
        administrative corrections remain possible.
        """
        if self.env.context.get("physio_skip_validation"):
            return
        for rec in self:
            if not rec.appointment_date:
                continue
            if rec._origin and rec._origin.id:
                continue
            if rec.appointment_date < fields.Datetime.now():
                raise ValidationError(
                    _(
                        "You cannot create an appointment"
                        " in the past."
                    )
                )

    @api.constrains("appointment_date", "doctor_id", "shift_id")
    def _check_doctor_rules(self):
        """Validate shift assignment and time-slot overlap.

        All validation logic runs INSIDE the loop so that
        every record in a multi-record write is checked.
        """
        if self.env.context.get("physio_skip_validation"):
            return
        for rec in self:
            if not rec.appointment_date or not rec.doctor_id:
                continue

            has_shifts = bool(rec.doctor_id.sudo().time_shift_ids)
            if not rec.shift_id and has_shifts:
                raise ValidationError(
                    _("Please select a booking time shift.")
                )

            duration = int(rec.slot_duration or "30")
            start = rec.appointment_date
            end = start + timedelta(minutes=duration)

            overlap = self.search(
                [
                    ("id", "!=", rec.id),
                    ("doctor_id", "=", rec.doctor_id.id),
                    ("state", "!=", "cancelled"),
                    ("appointment_date", "<", end),
                    (
                        "appointment_end",
                        ">",
                        start,
                    ),
                ],
                limit=1,
            )
            if overlap:
                raise ValidationError(
                    _(
                        "Doctor %s already has an"
                        " appointment in this time slot."
                    )
                    % rec.doctor_id.name
                )

            # Doctor has no schedule configured -> free any time
            if not has_shifts:
                continue

            appt_time = rec._get_local_float_time(
                rec.appointment_date
            )

            shift = rec.shift_id
            start_time = self._normalize_float_time(
                shift.start_time
            )
            end_time = self._normalize_float_time(
                shift.end_time
            )

            if end_time <= start_time:
                end_time += 24
                if appt_time < start_time:
                    appt_time += 24

            if not (start_time <= appt_time <= end_time):
                raise ValidationError(
                    _(
                        "Appointment time must be within"
                        " the doctor's working shift."
                    )
                )



    @api.depends("appointment_date", "slot_duration")
    def _compute_appointment_end(self):
        for rec in self:
            if rec.appointment_date and rec.slot_duration:
                rec.appointment_end = (
                        rec.appointment_date
                        + timedelta(minutes=int(rec.slot_duration))
                )
            else:
                rec.appointment_end = False

    @api.depends("appointment_no")
    def _compute_invoice_count(self):
        appt_nos = self.filtered("appointment_no").mapped("appointment_no")
        if not appt_nos:
            for rec in self:
                rec.invoice_count = 0
            return

        Move = self.env["account.move"]
        groups = Move._read_group(
            domain=[
                ("invoice_origin", "in", appt_nos),
                ("move_type", "=", "out_invoice"),
            ],
            groupby=["invoice_origin"],
            aggregates=["__count"],
        )
        count_map = {origin: count for origin, count in groups}
        for rec in self:
            rec.invoice_count = count_map.get(
                rec.appointment_no, 0
            )

    @api.depends("doctor_id", "doctor_id.time_shift_ids")
    def _compute_available_shifts(self):
        for rec in self:
            if rec.doctor_id:
                rec.available_shift_ids = (
                    rec.doctor_id.sudo().time_shift_ids.ids
                )
            else:
                rec.available_shift_ids = False

    # AFTER — safe guard on patient_id before attribute access
    @api.depends(
        "patient_id",
        "patient_id.name",
        "patient_id.phone",
        "appointment_no",
    )
    def _compute_display_name(self):
        for rec in self:
            apt = rec.appointment_no or ""
            patient = rec.patient_id.name if rec.patient_id else ""
            mobile = rec.patient_id.phone if rec.patient_id else ""
            rec.display_name = (
                "%s | %s | %s" % (apt, patient, mobile)
                if any([apt, patient, mobile])
                else _("New Appointment")
            )

    @api.depends("appointment_no")
    def _compute_qr_codes(self):
        """Generate QR codes for booking and appointment URLs.

        The base URL is fetched once outside the loop for
        efficiency.
        """
        base_url = (
            self.env["ir.config_parameter"]
            .sudo()
            .get_param("web.base.url")
        )
        for rec in self:
            if not rec.appointment_no:
                rec.booking_qr = False
                rec.appointment_qr = False
                continue

            booking_url = "%s/book-appointment" % base_url
            appointment_url = (
                    "%s/my/appointments/%s" % (base_url, rec.id)
            )

            rec.booking_qr = self._generate_qr_binary(
                booking_url
            )
            rec.appointment_qr = self._generate_qr_binary(
                appointment_url
            )

    def write(self, vals):
        """Validate rules on write; handle calendar resize."""
        if self.env.context.get("physio_skip_validation"):
            return super().write(vals)
        schedule_fields = {
            "appointment_date",
            "appointment_end",
            "doctor_id",
            "shift_id",
            "slot_duration",
        }
        # Status-only changes (confirm / start / done / cancel)
        # must not re-run schedule validation, otherwise old or
        # cancelled bookings could never change state.
        if (
                not schedule_fields.intersection(vals)
                or vals.get("state") == "cancelled"
        ):
            return super().write(vals)

        for rec in self:
            if rec.state == "done" and any(
                    f in vals
                    for f in ("appointment_date", "appointment_end")
            ):
                raise UserError(
                    _(
                        "You cannot modify or move a"
                        " completed appointment."
                    )
                )

            start = vals.get(
                "appointment_date", rec.appointment_date
            )

            # Calendar resize: snap to allowed duration
            if "appointment_end" in vals and start:
                end = vals.get("appointment_end")

                if isinstance(start, str):
                    start = fields.Datetime.from_string(start)
                if isinstance(end, str):
                    end = fields.Datetime.from_string(end)

                duration = int(
                    (end - start).total_seconds() / 60
                )

                if duration <= 15:
                    vals["slot_duration"] = "15"
                elif duration <= 30:
                    vals["slot_duration"] = "30"
                elif duration <= 60:
                    vals["slot_duration"] = "60"
                else:
                    vals["slot_duration"] = "120"

            rec._validate_doctor_time_rules(
                start,
                vals.get("doctor_id", rec.doctor_id.id),
                vals.get("shift_id", rec.shift_id.id),
                vals.get(
                    "appointment_end", rec.appointment_end
                ),
                exclude_id=rec.id,
            )

            rec._check_shift_limit(
                start,
                vals.get("shift_id", rec.shift_id.id),
                vals.get("doctor_id", rec.doctor_id.id),
                exclude_id=rec.id,
            )

            if (
                    start
                    and not vals.get("shift_id")
                    and not rec.shift_id
            ):
                raise ValidationError(
                    _("Please select a booking time shift.")
                )

        return super().write(vals)

    @api.model_create_multi
    def create(self, vals_list):
        """Create appointments with full per-record processing.

        Each vals dict is processed individually: computing end
        time, validating doctor rules, assigning patient codes,
        updating patient records, and generating sequence
        numbers.  ``super().create()`` is called once at the end
        with the fully prepared list.
        """
        for vals in vals_list:
            start = vals.get("appointment_date")
            slot = vals.get("slot_duration", "30")

            if start:
                if isinstance(start, str):
                    start = fields.Datetime.from_string(start)
                vals["appointment_end"] = (
                        start + timedelta(minutes=int(slot))
                )

                self._validate_doctor_time_rules(
                    vals.get("appointment_date"),
                    vals.get("doctor_id"),
                    vals.get("shift_id"),
                    vals.get("appointment_end"),
                )

                self._check_shift_limit(
                    vals.get("appointment_date"),
                    vals.get("shift_id"),
                    vals.get("doctor_id"),
                )

            if vals.get("patient_id"):
                patient = self.env["res.partner"].browse(
                    vals["patient_id"]
                )

                if (
                        not patient.patient_code
                        or patient.patient_code == "New"
                ):
                    patient_code = self.env[
                                       "ir.sequence"
                                   ].next_by_code(
                        "medical.patient"
                    ) or "PAT/NEW"
                    patient.write(
                        {"patient_code": patient_code}
                    )
                    vals["patient_code"] = patient_code
                else:
                    vals["patient_code"] = patient.patient_code

                patient.write(
                    {
                        "is_patient": True,
                        "gender": vals.get(
                            "gender", patient.gender
                        ),
                        "phone": vals.get(
                            "phone", patient.phone
                        ),
                    }
                )

            if not vals.get("appointment_no"):
                vals["appointment_no"] = self.env[
                                             "ir.sequence"
                                         ].next_by_code(
                    "medical.appointment"
                ) or "APT/NEW"

            if not vals.get("responsible_user"):
                vals["responsible_user"] = (
                    self.env.user.name
                )

        return super().create(vals_list)

    # ------------------------------------------------------------------
    # Helper methods
    # ------------------------------------------------------------------

    @staticmethod
    def _normalize_float_time(value):
        """Convert ambiguous float times to true decimals.

        Example: 9.30 (meaning 9:30) becomes 9.5.
        """
        return int(value) + (value % 1) * 100 / 60

    def _get_local_float_time(self, dt):
        """Convert a UTC datetime to a local float time.

        Odoo stores Datetime fields as naive UTC. Localize
        to UTC first so the conversion to user tz is correct.
        """
        tz_name = self.env.user.tz or self.env.company.partner_id.tz or "UTC"
        user_tz = pytz.timezone(tz_name)
        if dt.tzinfo is None:
            dt = pytz.utc.localize(dt)
        local_dt = dt.astimezone(user_tz)
        return local_dt.hour + local_dt.minute / 60.0

    @staticmethod
    def _float_to_time_string(float_time):
        """Convert a float time to a 12-hour string.

        Example: 14.5 becomes '2:30 PM'.
        """
        hours = int(float_time)
        minutes = int(round((float_time - hours) * 60))
        if minutes == 60:
            hours += 1
            minutes = 0
        suffix = "AM" if hours < 12 else "PM"
        display_hour = hours % 12 or 12
        return "%d:%02d %s" % (display_hour, minutes, suffix)

    @staticmethod
    def _generate_qr_binary(url):
        """Return a base64-encoded PNG QR code for *url*."""
        qr = qrcode.make(url)
        buf = BytesIO()
        qr.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue())

    # ------------------------------------------------------------------
    # Validation helpers
    # ------------------------------------------------------------------

    def _validate_doctor_time_rules(
            self,
            appointment_date,
            doctor_id,
            shift_id,
            appointment_end=None,
            exclude_id=None,
    ):
        """Comprehensive validation of overlap and shift rules.

        This is the single reusable entry point called by both
        ``create`` and ``write``.
        """
        if self.env.context.get("physio_skip_validation"):
            return
        if (
                not appointment_date
                or not doctor_id
        ):
            return

        if isinstance(appointment_date, str):
            appointment_date = fields.Datetime.from_string(
                appointment_date
            )
        if appointment_end and isinstance(
                appointment_end, str
        ):
            appointment_end = fields.Datetime.from_string(
                appointment_end
            )

        if not appointment_end:
            appointment_end = appointment_date + timedelta(
                minutes=30
            )

        doctor = self.env["hr.employee"].browse(doctor_id)
        shift = self.env["medical.time.shift"].browse(shift_id)

        tz_name = self.env.user.tz or "UTC"
        user_tz = pytz.timezone(tz_name)

        local_start = pytz.utc.localize(appointment_date).astimezone(user_tz)
        local_end = pytz.utc.localize(appointment_end).astimezone(user_tz)

        # -- Overlap check (real range comparison) --
        domain = [
            ("doctor_id", "=", doctor.id),
            ("state", "!=", "cancelled"),
        ]
        if exclude_id:
            domain.append(("id", "!=", exclude_id))

        appointments = self.env[
            "medical.appointment"
        ].search(domain)

        for appt in appointments:
            appt_start = pytz.utc.localize(appt.appointment_date).astimezone(
                user_tz
            )
            appt_end = (
                pytz.utc.localize(appt.appointment_end).astimezone(user_tz)
                if appt.appointment_end
                else appt_start
                     + timedelta( \
                    minutes=int(appt.slot_duration or "30")
                )
            )

            if local_start < appt_end and local_end > appt_start:
                raise UserError(
                    _(
                        "Doctor %(doc)s is already booked"
                        " from %(start)s to %(end)s."
                    )
                    % {
                        "doc": doctor.name,
                        "start": appt_start.strftime(
                            "%I:%M %p"
                        ).lstrip("0"),
                        "end": appt_end.strftime(
                            "%I:%M %p"
                        ).lstrip("0"),
                    }
                )

        # -- Shift validation --
        # No schedule configured on doctor -> available any time
        if not doctor.time_shift_ids:
            return

        appt_time = self._get_local_float_time(
            appointment_date
        )

        valid_shift = False
        for s in doctor.time_shift_ids:
            s_start = self._normalize_float_time(
                s.start_time
            )
            s_end = self._normalize_float_time(s.end_time)
            check_time = appt_time

            if s_end <= s_start:
                s_end += 24
                if check_time < s_start:
                    check_time += 24

            if s_start <= check_time <= s_end:
                valid_shift = s
                break

        if not valid_shift:
            raise UserError(
                _(
                    "Appointment time %s is outside the"
                    " doctor's working hours."
                )
                % self._float_to_time_string(appt_time)
            )

        if shift_id != valid_shift.id:
            raise ValidationError(
                _(
                    "Selected shift does not match the"
                    " doctor's working time."
                )
            )

    def _check_shift_limit(
            self,
            appointment_date,
            shift_id,
            doctor_id,
            exclude_id=False,
    ):
        """Enforce maximum appointments per shift per day."""
        if self.env.context.get("physio_skip_validation"):
            return
        if (
                not appointment_date
                or not shift_id
                or not doctor_id
        ):
            return

        if isinstance(appointment_date, str):
            appointment_date = fields.Datetime.from_string(
                appointment_date
            )

        shift = self.env["medical.time.shift"].browse(
            shift_id
        )
        doctor = self.env["hr.employee"].browse(doctor_id)

        start_day = appointment_date.replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        end_day = appointment_date.replace(
            hour=23, minute=59, second=59, microsecond=0
        )

        domain = [
            ("appointment_date", ">=", start_day),
            ("appointment_date", "<=", end_day),
            ("shift_id", "=", shift.id),
            ("doctor_id", "=", doctor.id),
            ("state", "!=", "cancelled"),
        ]
        if exclude_id:
            domain.append(("id", "!=", exclude_id))

        count = self.env[
            "medical.appointment"
        ].search_count(domain)

        max_appts = shift.max_appointments or 10
        if count >= max_appts:
            raise ValidationError(
                _(
                    "Maximum %(max)s appointments allowed"
                    " for Dr. %(doctor)s in this shift"
                    " on %(date)s."
                )
                % {
                    "max": max_appts,
                    "doctor": doctor.display_name,
                    "date": start_day.date(),
                }
            )



    def action_draft(self):
        for rec in self:
            rec.state = "draft"

    def action_confirm(self):
        template = self.env.ref(
            "sp_physiotherapy"
            ".mail_template_appointment_confirmed",
            raise_if_not_found=False,
        )
        # FIX Z1: Zoom service was defined but never called.
        # Create the meeting on confirmation so that
        # zoom_meeting_url and zoom_meeting_id are populated
        # and the "Video Consultation" group becomes visible.
        zoom_service = self.env["zoom.meeting.service"]
        for rec in self:
            if rec.state not in ("draft", "in_progress"):
                continue
            rec.write({"state": "confirmed"})

            # Create the Zoom meeting first so the confirmation
            # email can include the join link.
            try:
                zoom_result = zoom_service.create_meeting(rec)
                if zoom_result.get("status") == "created":
                    rec.write({
                        "zoom_meeting_url": zoom_result.get(
                            "join_url", ""
                        ),
                        "zoom_meeting_id": zoom_result.get(
                            "meeting_id", ""
                        ),
                    })
            except Exception as e:
                _logger.warning(
                    "Zoom meeting creation failed for"
                    " %s: %s",
                    rec.appointment_no,
                    str(e),
                )

            if template and rec.patient_id.email:
                try:
                    template.sudo().send_mail(
                        rec.id, force_send=True
                    )
                except Exception as e:
                    rec.message_post(
                        body=_(
                            "Email could not be sent: %s"
                        )
                             % str(e)
                    )

    def action_start(self):
        for rec in self:
            if rec.state == "confirmed":
                rec.state = "in_progress"

    def action_done(self):
        for rec in self:
            if rec.state in ("confirmed", "in_progress"):
                rec.state = "done"

    def action_cancel(self):
        # FIX Z1: Delete the Zoom meeting when the appointment
        # is cancelled so orphaned meetings are not left on
        # the Zoom account.
        zoom_service = self.env["zoom.meeting.service"]
        for rec in self:
            if rec.zoom_meeting_id:
                try:
                    zoom_service.delete_meeting(
                        rec.zoom_meeting_id
                    )
                except Exception as e:
                    _logger.warning(
                        "Zoom meeting deletion failed for"
                        " %s: %s",
                        rec.appointment_no,
                        str(e),
                    )
                rec.write({
                    "zoom_meeting_url": False,
                    "zoom_meeting_id": False,
                })
            rec.state = "cancelled"

    # ------------------------------------------------------------------
    # Invoice actions
    # ------------------------------------------------------------------

    def action_create_invoice(self):
        """Create a customer invoice for a completed appointment.

        Uses the appointment's consultation_fee. Raises an error
        when the fee is not configured.
        """
        self.ensure_one()

        if self.state != "done":
            raise UserError(
                _(
                    "You can only create an invoice after"
                    " the appointment is completed."
                )
            )

        if not self.patient_id:
            raise UserError(
                _(
                    "A patient is required to create"
                    " an invoice."
                )
            )

        if not self.consultation_fee:
            raise UserError(
                _(
                    "Please set the consultation fee"
                    " before creating an invoice."
                )
            )

        journal = self.env["account.journal"].search(
            [("type", "=", "sale")], limit=1
        )
        if not journal:
            raise UserError(
                _("Please configure a Sales Journal.")
            )

        payment_term = (
            self.patient_id.property_payment_term_id
        )
        if not payment_term:
            payment_term = self.env[
                "account.payment.term"
            ].search([], limit=1)
        if not payment_term:
            raise UserError(
                _(
                    "Please configure at least one"
                    " Payment Term."
                )
            )

        invoice_vals = {
            "move_type": "out_invoice",
            "partner_id": self.patient_id.id,
            "invoice_origin": self.appointment_no,
            "invoice_date": fields.Date.today(),
            "journal_id": journal.id,
            "invoice_payment_term_id": payment_term.id,
            "invoice_line_ids": [
                (
                    0,
                    0,
                    {
                        "name": _(
                            "Medical Consultation"
                        ),
                        "quantity": 1,
                        "price_unit": (
                            self.consultation_fee
                        ),
                    },
                )
            ],
        }

        invoice = self.env["account.move"].create(
            invoice_vals
        )
        self.invoice_id = invoice.id

        return {
            "type": "ir.actions.act_window",
            "res_model": "account.move",
            "view_mode": "form",
            "res_id": invoice.id,
            "target": "current",
        }

    def action_view_invoice(self):
        """Navigate to invoices linked to this appointment."""
        self.ensure_one()
        invoices = self.env["account.move"].search(
            [
                (
                    "invoice_origin",
                    "=",
                    self.appointment_no,
                ),
                ("move_type", "=", "out_invoice"),
            ]
        )
        if not invoices:
            return {}
        if len(invoices) == 1:
            return {
                "type": "ir.actions.act_window",
                "name": _("Invoice"),
                "res_model": "account.move",
                "view_mode": "form",
                "res_id": invoices.id,
                "target": "current",
            }
        return {
            "type": "ir.actions.act_window",
            "name": _("Invoices"),
            "res_model": "account.move",
            "view_mode": "list,form",
            "domain": [("id", "in", invoices.ids)],
            "target": "current",
        }

    # ------------------------------------------------------------------
    # Onchange methods
    # ------------------------------------------------------------------

    @api.onchange("appointment_date", "doctor_id")
    def _onchange_auto_select_shift(self):
        """Auto-select the matching shift for the appointment
        time and doctor.
        """
        if (
                not self.appointment_date
                or not self.doctor_id
        ):
            self.shift_id = False
            return

        appt_time = self._get_local_float_time(
            self.appointment_date
        )
        selected_shift = False

        for shift in self.doctor_id.time_shift_ids:
            s_start = self._normalize_float_time(
                shift.start_time
            )
            s_end = self._normalize_float_time(
                shift.end_time
            )
            check_time = appt_time

            if s_end <= s_start:
                s_end += 24
                if check_time < s_start:
                    check_time += 24

            if s_start <= check_time <= s_end:
                selected_shift = shift
                break

        self.shift_id = selected_shift

    @api.onchange("patient_code")
    def _onchange_patient_code(self):
        if self.patient_code:
            patient = self.env["res.partner"].search(
                [("patient_code", "=", self.patient_code)],
                limit=1,
            )
            if patient:
                self.patient_id = patient
                self.gender = patient.gender
                self.age = patient.age
            else:
                self.patient_id = False
                self.gender = False
                self.age = False
                self.phone = False

    @api.onchange("patient_id")
    def _onchange_patient_id(self):
        if self.patient_id:
            self.patient_code = (
                    self.patient_id.patient_code or ""
            )
            self.gender = self.patient_id.gender
            self.age = self.patient_id.age
        self.responsible_user = self.env.user.name

    @api.onchange(
        "appointment_date", "doctor_id", "shift_id"
    )
    def _onchange_doctor_rules(self):
        """Warning-based validation for real-time feedback
        in the form view.
        """
        for rec in self:
            if (
                    not rec.appointment_date
                    or not rec.doctor_id
            ):
                continue

            warnings = []

            duration = int(rec.slot_duration or "30")
            start = rec.appointment_date
            end = start + timedelta(minutes=duration)

            overlap = self.env[
                "medical.appointment"
            ].search(
                [
                    ("id", "!=", rec._origin.id),
                    ("doctor_id", "=", rec.doctor_id.id),
                    ("state", "!=", "cancelled"),
                    ("appointment_date", "<", end),
                    (
                        "appointment_end",
                        ">",
                        start,
                    ),
                ],
                limit=1,
            )
            if overlap:
                warnings.append(
                    _(
                        "Doctor %s already has an"
                        " appointment in this time slot."
                    )
                    % rec.doctor_id.name
                )
                rec.appointment_date = False

            if rec.appointment_date and rec.shift_id:
                appt_time = rec._get_local_float_time(
                    rec.appointment_date
                )
                s_start = self._normalize_float_time(
                    rec.shift_id.start_time
                )
                s_end = self._normalize_float_time(
                    rec.shift_id.end_time
                )

                if s_end <= s_start:
                    s_end += 24
                    if appt_time < s_start:
                        appt_time += 24

                if not (s_start <= appt_time <= s_end):
                    warnings.append(
                        _(
                            "Appointment time must be"
                            " within the doctor's"
                            " working shift."
                        )
                    )
                    rec.appointment_date = False

            if warnings:
                return {
                    "warning": {
                        "title": _(
                            "Invalid Appointment"
                        ),
                        "message": "\n".join(warnings),
                    }
                }