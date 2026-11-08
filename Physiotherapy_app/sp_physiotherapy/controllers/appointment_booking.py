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
import hashlib
import hmac
import io
import logging

import pytz
import qrcode

from datetime import datetime, timedelta

from odoo import _, http
from odoo.http import request

_logger = logging.getLogger(__name__)


class AppointmentBooking(http.Controller):
    """Website controller for public appointment booking.

    Handles slot lookup, form submission, payment flow,
    and HMAC-secured payment callbacks.
    """

    # --------------------------------------------------------------
    # HMAC helpers
    # --------------------------------------------------------------

    def _generate_payment_token(self, appointment_id):
        """Create an HMAC token for a payment callback URL.

        The token binds the appointment id to the database
        secret so that only the server can produce a valid
        callback URL.
        """
        secret = (
            request.env["ir.config_parameter"]
            .sudo()
            .get_param("database.secret", "")
        )
        msg = str(appointment_id).encode()
        return hmac.new(
            secret.encode(), msg, hashlib.sha256
        ).hexdigest()[:32]

    def _verify_payment_token(self, appointment_id, token):
        """Return True when *token* matches the expected
        HMAC for *appointment_id*."""
        expected = self._generate_payment_token(
            appointment_id
        )
        return hmac.compare_digest(expected, token or "")

    # --------------------------------------------------------------
    # Timezone helper
    # --------------------------------------------------------------

    @staticmethod
    def _get_user_tz():
        """Return a pytz timezone for the current user.

        Falls back to the company timezone, then to UTC.
        """
        tz_name = request.env.user.tz or "UTC"
        return pytz.timezone(tz_name)

    # --------------------------------------------------------------
    # AJAX: available slots
    # --------------------------------------------------------------

    @http.route(
        "/get-available-slots",
        type="jsonrpc",
        auth="public",
    )
    def get_available_slots(self, doctor_id, date):
        """Return time slots for *doctor_id* on *date*.

        Each slot carries the shift id, duration, and a
        boolean indicating whether it is already booked.
        """
        if not doctor_id or not date:
            return []

        doctor = (
            request.env["hr.employee"]
            .sudo()
            .browse(int(doctor_id))
        )
        if not doctor.exists():
            return []

        user_tz = self._get_user_tz()
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        selected_day = str(date_obj.weekday())

        local_start = user_tz.localize(
            date_obj.replace(
                hour=0, minute=0, second=0
            )
        )
        local_end = user_tz.localize(
            date_obj.replace(
                hour=23, minute=59, second=59
            )
        )
        utc_start = (
            local_start.astimezone(pytz.utc)
            .replace(tzinfo=None)
        )
        utc_end = (
            local_end.astimezone(pytz.utc)
            .replace(tzinfo=None)
        )

        appointments = (
            request.env["medical.appointment"]
            .sudo()
            .search([
                ("doctor_id", "=", doctor.id),
                ("state", "!=", "cancelled"),
                ("appointment_date", ">=", utc_start),
                ("appointment_date", "<=", utc_end),
            ])
        )

        booked_slots = {}
        for appt in appointments:
            local_dt = (
                pytz.utc
                .localize(appt.appointment_date)
                .astimezone(user_tz)
            )
            booked_slots[local_dt.strftime("%H:%M")] = True

        all_slots = []
        for shift in doctor.time_shift_ids:
            if shift.working_day_ids:
                shift_days = [
                    wd.code for wd in shift.working_day_ids
                ]
                if selected_day not in shift_days:
                    continue

            duration_minutes = int(
                shift.slot_duration or "30"
            )
            duration_hours = duration_minutes / 60.0
            start = shift.start_time
            end = shift.end_time
            current = start

            while current < end:
                hour = int(current)
                minute = int(
                    round((current - hour) * 60)
                )
                if minute == 60:
                    hour += 1
                    minute = 0

                slot_time = "%02d:%02d" % (hour, minute)
                all_slots.append({
                    "time": slot_time,
                    "shift_id": shift.id,
                    "duration": duration_minutes,
                    "is_booked": slot_time in booked_slots,
                })
                current += duration_hours

        return all_slots

    # --------------------------------------------------------------
    # AJAX: available days
    # --------------------------------------------------------------

    @http.route(
        "/get-doctor-available-days",
        type="jsonrpc",
        auth="public",
    )
    def get_doctor_available_days(self, doctor_id):
        """Return weekday codes where *doctor_id* has at
        least one configured shift."""
        if not doctor_id:
            return []

        doctor = (
            request.env["hr.employee"]
            .sudo()
            .browse(int(doctor_id))
        )
        if not doctor.exists():
            return []

        available_days = []
        for shift in doctor.time_shift_ids:
            if shift.working_day_ids:
                for wd in shift.working_day_ids:
                    if wd.code not in available_days:
                        available_days.append(wd.code)
            else:
                return [
                    "0", "1", "2", "3",
                    "4", "5", "6",
                ]
        return available_days

    # --------------------------------------------------------------
    # Booking form page
    # --------------------------------------------------------------

    @http.route(
        "/book-appointment",
        type="http",
        auth="public",
        website=True,
    )
    def appointment_form(self, **kwargs):
        """Render the public appointment booking form."""
        doctors = (
            request.env["hr.employee"]
            .sudo()
            .search([("is_doctor", "=", True)])
        )
        base_url = (
            request.env["ir.config_parameter"]
            .sudo()
            .get_param("web.base.url")
        )
        booking_url = "%s/book-appointment" % base_url

        return request.render(
            "sp_physiotherapy.website_appointment_form",
            {
                "doctors": doctors,
                "booking_url": booking_url,
            },
        )

    @http.route(
        "/book-appointment/qr",
        type="http",
        auth="public",
        website=True,
    )
    def appointment_qr_page(self, **kwargs):
        """Page showing the QR code that opens the booking form."""
        base_url = (
            request.env["ir.config_parameter"]
            .sudo()
            .get_param("web.base.url")
        )
        booking_url = "%s/book-appointment" % base_url

        buffer = io.BytesIO()
        qrcode.make(booking_url).save(buffer, format="PNG")
        qr_image = base64.b64encode(buffer.getvalue()).decode()

        return request.render(
            "sp_physiotherapy.website_appointment_qr",
            {"booking_url": booking_url, "qr_image": qr_image},
        )

    # --------------------------------------------------------------
    # Form submission
    # --------------------------------------------------------------

    @http.route(
        "/submit-appointment",
        type="http",
        auth="public",
        website=True,
        methods=["POST"],
    )
    def submit_appointment(self, **post):
        """Validate and create an appointment from the
        public booking form, then redirect to payment."""
        name = post.get("name")
        email = post.get("email")
        phone = post.get("phone")
        doctor_id = int(post.get("doctor_id", 0))
        appointment_date = post.get("appointment_date")
        slot_data = post.get("slot_time")

        if not slot_data or not doctor_id:
            return request.redirect("/book-appointment")

        parts = slot_data.split("|")
        if len(parts) != 2:
            return request.redirect("/book-appointment")
        time_str, shift_id_str = parts
        try:
            shift_id = int(shift_id_str)
        except ValueError:
            return request.redirect("/book-appointment")

        shift = (
            request.env["medical.time.shift"]
            .sudo()
            .browse(shift_id)
        )
        duration = int(shift.slot_duration or "30")

        user_tz = self._get_user_tz()
        local_dt = datetime.strptime(
            "%s %s" % (appointment_date, time_str),
            "%Y-%m-%d %H:%M",
        )
        local_dt = user_tz.localize(local_dt)
        date_time = (
            local_dt.astimezone(pytz.utc)
            .replace(tzinfo=None)
        )

        doctor = (
            request.env["hr.employee"]
            .sudo()
            .browse(doctor_id)
        )

        user = request.env.user
        is_public = user._is_public()

        if not is_public:
            partner = user.partner_id
            if not partner.email:
                return request.render(
                    "sp_physiotherapy.website_appointment_error",
                    {
                        "error_message": _(
                            "Please add an email address to your"
                            " account before booking an appointment."
                        ),
                        "doctor_name": "",
                    },
                )
            partner.sudo().write({
                "name": name or partner.name,
                "phone": phone or partner.phone,
                "is_patient": True,
            })
        else:
            partner = (
                request.env["res.partner"]
                .sudo()
                .search([("email", "=", email)], limit=1)
            )
            if not partner:
                partner = (
                    request.env["res.partner"]
                    .sudo()
                    .create({
                        "name": name,
                        "email": email,
                        "phone": phone,
                        "is_patient": True,
                    })
                )

        slot_start = date_time
        slot_end = slot_start + timedelta(minutes=duration)

        existing = (
            request.env["medical.appointment"]
            .sudo()
            .search([
                ("doctor_id", "=", doctor.id),
                ("state", "!=", "cancelled"),
                ("appointment_date", "<", slot_end),
                ("appointment_end", ">", slot_start),
            ], limit=1)
        )
        if existing:
            return request.render(
                "sp_physiotherapy"
                ".website_appointment_error",
                {
                    "error_message": _(
                        "This time slot is already booked."
                        " Please select another time."
                    ),
                    "doctor_name": doctor.name,
                },
            )

        appointment = (
            request.env["medical.appointment"]
            .sudo()
            .create({
                "patient_id": partner.id,
                "doctor_id": doctor.id,
                "shift_id": shift_id,
                "slot_duration": str(duration),
                "appointment_date": date_time,
                "state": "draft",
            })
        )

        token = self._generate_payment_token(
            appointment.id
        )
        request.session[
            "appointment_%s_token" % appointment.id
        ] = token

        return request.redirect(
            "/appointment/payment/%s?token=%s"
            % (appointment.id, token)
        )

    # --------------------------------------------------------------
    # Payment page
    # --------------------------------------------------------------

    @http.route(
        "/appointment/payment/<int:appointment_id>",
        type="http",
        auth="public",
        website=True,
    )
    def appointment_payment(
        self, appointment_id, token=None, **kwargs
    ):
        """Show payment providers for the appointment.

        Verifies that the appointment exists and that
        the caller holds a valid session token or HMAC
        token for it.
        """
        appointment = (
            request.env["medical.appointment"]
            .sudo()
            .browse(appointment_id)
        )
        if not appointment.exists():
            return request.redirect("/book-appointment")

        session_token = request.session.get(
            "appointment_%s_token" % appointment_id
        )
        if not self._verify_payment_token(
            appointment_id, token
        ) and not self._verify_payment_token(
            appointment_id, session_token
        ):
            return request.redirect("/book-appointment")

        providers = (
            request.env["payment.provider"]
            .sudo()
            .search([
                ("state", "in", ["enabled", "test"]),
            ])
        )

        valid_token = self._generate_payment_token(
            appointment_id
        )

        return request.render(
            "sp_physiotherapy"
            ".website_appointment_payment",
            {
                "appointment": appointment,
                "providers": providers,
                "payment_token": valid_token,
            },
        )

    # --------------------------------------------------------------
    # Payment success (HMAC-secured)
    # --------------------------------------------------------------

    @http.route(
        "/appointment/payment/success",
        type="http",
        auth="public",
        website=True,
    )
    def appointment_payment_success(
        self, appointment_id=None, token=None, **kwargs
    ):
        """Confirm the appointment after successful payment.

        The callback URL must carry a valid HMAC token.
        Without it the appointment state is not changed.
        """
        if not appointment_id:
            return request.redirect("/book-appointment")

        apt_id = int(appointment_id)
        if not self._verify_payment_token(apt_id, token):
            _logger.warning(
                "Invalid payment token for appointment %s",
                apt_id,
            )
            return request.redirect("/book-appointment")

        appointment = (
            request.env["medical.appointment"]
            .sudo()
            .browse(apt_id)
        )

        if (
            appointment.exists()
            and appointment.state == "draft"
        ):
            appointment.write({"state": "confirmed"})

            template = request.env.ref(
                "sp_physiotherapy"
                ".mail_template_appointment_confirmed",
                raise_if_not_found=False,
            )
            if template and appointment.patient_id.email:
                try:
                    template.sudo().send_mail(
                        appointment.id, force_send=True
                    )
                except Exception as exc:
                    _logger.warning(
                        "Email send failed for "
                        "appointment %s: %s",
                        appointment.id,
                        exc,
                    )

            try:
                sms_service = (
                    request.env["twilio.sms.service"]
                    .sudo()
                )
                sms_service.send_appointment_confirmation(
                    appointment
                )
            except Exception as exc:
                _logger.warning(
                    "SMS send failed for "
                    "appointment %s: %s",
                    appointment.id,
                    exc,
                )

        request.session.pop(
            "appointment_%s_token" % apt_id, None
        )
        return request.redirect("/thank-you")

    # --------------------------------------------------------------
    # Payment cancel (HMAC-secured)
    # --------------------------------------------------------------

    @http.route(
        "/appointment/payment/cancel",
        type="http",
        auth="public",
        website=True,
    )
    def appointment_payment_cancel(
        self, appointment_id=None, token=None, **kwargs
    ):
        """Cancel the appointment after payment failure.

        Requires a valid HMAC token to prevent
        unauthorized cancellations.
        """
        if appointment_id:
            apt_id = int(appointment_id)
            if not self._verify_payment_token(
                apt_id, token
            ):
                _logger.warning(
                    "Invalid cancel token for "
                    "appointment %s",
                    apt_id,
                )
                return request.redirect(
                    "/book-appointment"
                )

            appointment = (
                request.env["medical.appointment"]
                .sudo()
                .browse(apt_id)
            )
            if appointment.exists():
                appointment.write(
                    {"state": "cancelled"}
                )

            request.session.pop(
                "appointment_%s_token" % apt_id, None
            )

        return request.render(
            "sp_physiotherapy"
            ".website_appointment_error",
            {
                "error_message": _(
                    "Payment was cancelled. Your"
                    " appointment has not been"
                    " confirmed."
                ),
                "doctor_name": "",
            },
        )

    # --------------------------------------------------------------
    # Thank-you page
    # --------------------------------------------------------------

    @http.route(
        "/thank-you",
        type="http",
        auth="public",
        website=True,
    )
    def thank_you(self, **kwargs):
        """Render the post-booking thank-you page."""
        return request.render(
            "sp_physiotherapy.website_thank_you", {}
        )