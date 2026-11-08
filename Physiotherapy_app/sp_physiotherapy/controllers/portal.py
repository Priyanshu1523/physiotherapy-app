# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology (<>).
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

from datetime import datetime

import pytz

from odoo import _, http
from odoo.http import request
from odoo.addons.portal.controllers.portal import (
    CustomerPortal,
)

ADMIN_GROUP = "sp_physiotherapy.group_physiotherapy_admin"
DOCTOR_GROUP = (
    "sp_physiotherapy.group_physiotherapy_doctor"
)


class PhysiotherapyPortal(CustomerPortal):
    """Extend the Odoo portal with physiotherapy
    appointment views and a public waiting screen.

    Access is role-based: administrators see everything,
    doctors see their own appointments, and patients see
    only theirs.
    """


    @staticmethod
    def _get_user_tz():
        """Return a pytz timezone for the current user,
        falling back to company tz then UTC."""
        tz_name = request.env.user.tz or "UTC"
        return pytz.timezone(tz_name)

    def _get_role_and_domain(self):
        """Return (portal_role, domain) based on the
        current user's security groups."""
        user = request.env.user
        if user.has_group(ADMIN_GROUP):
            return "admin", []
        if user.has_group(DOCTOR_GROUP):
            employee = (
                request.env["hr.employee"]
                .sudo()
                .search(
                    [("user_id", "=", user.id)],
                    limit=1,
                )
            )
            domain = (
                [("doctor_id", "=", employee.id)]
                if employee
                else [("id", "=", 0)]
            )
            return "doctor", domain
        return (
            "patient",
            [("patient_id", "=", user.partner_id.id)],
        )

    def _get_today_utc_range(self):
        """Return (today_start, today_end) in naive UTC
        datetimes corresponding to the current local day."""
        user_tz = self._get_user_tz()
        now_utc = datetime.utcnow()
        now_local = (
            pytz.utc.localize(now_utc).astimezone(user_tz)
        )
        today_start = (
            now_local.replace(
                hour=0, minute=0, second=0,
                microsecond=0,
            )
            .astimezone(pytz.utc)
            .replace(tzinfo=None)
        )
        today_end = (
            now_local.replace(
                hour=23, minute=59, second=59,
                microsecond=0,
            )
            .astimezone(pytz.utc)
            .replace(tzinfo=None)
        )
        return today_start, today_end

    # --------------------------------------------------------------
    # Portal home counter
    # --------------------------------------------------------------

    def _prepare_home_portal_values(self, counters):
        """Inject the appointment count into the portal
        home dashboard."""
        values = super()._prepare_home_portal_values(
            counters
        )
        if "appointment_count" in counters:
            _role, domain = self._get_role_and_domain()
            values["appointment_count"] = (
                request.env["medical.appointment"]
                .sudo()
                .search_count(domain)
            )
        return values

    @http.route(
        "/my/appointments",
        type="http",
        auth="user",
        website=True,
    )
    def portal_my_appointments(self, **kw):
        """List appointments grouped by status for the
        logged-in user."""
        portal_role, domain = (
            self._get_role_and_domain()
        )
        Appointment = (
            request.env["medical.appointment"].sudo()
        )
        today_start, today_end = (
            self._get_today_utc_range()
        )

        waiting_list = Appointment.search(
            domain + [
                ("appointment_date", ">=", today_start),
                ("appointment_date", "<=", today_end),
                (
                    "state",
                    "in",
                    ["confirmed", "in_progress"],
                ),
            ],
            order="appointment_date asc",
        )

        upcoming = Appointment.search(
            domain + [
                ("appointment_date", ">", today_end),
                (
                    "state",
                    "in",
                    ["draft", "confirmed"],
                ),
            ],
            order="appointment_date asc",
        )

        past = Appointment.search(
            domain + [("state", "=", "done")],
            order="appointment_date desc",
        )

        cancelled = Appointment.search(
            domain + [("state", "=", "cancelled")],
            order="appointment_date desc",
        )

        return request.render(
            "sp_physiotherapy"
            ".portal_appointment_templates",
            {
                "waiting_list": waiting_list,
                "upcoming": upcoming,
                "past": past,
                "cancelled": cancelled,
                "appointment_count": (
                    Appointment.search_count(domain)
                ),
                "page_name": "appointments",
                "portal_role": portal_role,
            },
        )

    # --------------------------------------------------------------
    # Appointment detail
    # --------------------------------------------------------------

    @http.route(
        "/my/appointments/<int:appointment_id>",
        type="http",
        auth="user",
        website=True,
    )
    def portal_appointment_detail(
        self, appointment_id, **kw
    ):
        """Detail view with role-based access control."""
        user = request.env.user
        appointment = (
            request.env["medical.appointment"]
            .sudo()
            .browse(appointment_id)
        )
        if not appointment.exists():
            return request.redirect("/my/appointments")

        is_admin = user.has_group(ADMIN_GROUP)
        is_doctor = user.has_group(DOCTOR_GROUP)

        if not is_admin:
            if is_doctor:
                employee = (
                    request.env["hr.employee"]
                    .sudo()
                    .search(
                        [("user_id", "=", user.id)],
                        limit=1,
                    )
                )
                if (
                    appointment.doctor_id.id
                    != employee.id
                ):
                    return request.redirect(
                        "/my/appointments"
                    )
            else:
                if (
                    appointment.patient_id.id
                    != user.partner_id.id
                ):
                    return request.redirect(
                        "/my/appointments"
                    )

        return request.render(
            "sp_physiotherapy"
            ".portal_appointment_detail",
            {"appointment": appointment},
        )

    # --------------------------------------------------------------
    # Cancel appointment
    # --------------------------------------------------------------

    @http.route(
        "/my/appointments/<int:appointment_id>/cancel",
        type="http",
        auth="user",
        website=True,
        methods=["POST"],
    )
    def portal_appointment_cancel(
        self, appointment_id, **kw
    ):
        """Cancel a draft or confirmed appointment from
        the portal.

        Access control: admins and doctors may cancel any
        appointment.  A patient may only cancel their own.
        """
        user = request.env.user
        appointment = (
            request.env["medical.appointment"]
            .sudo()
            .browse(appointment_id)
        )
        if not appointment.exists():
            return request.redirect("/my/appointments")

        is_admin = user.has_group(ADMIN_GROUP)
        is_doctor = user.has_group(DOCTOR_GROUP)

        if not is_admin and not is_doctor:
            if appointment.patient_id.id != user.partner_id.id:
                return request.redirect("/my/appointments")

        if appointment.state in ("draft", "confirmed"):
            # Write through the user's own environment so
            # ir.rule access rules are enforced.
            request.env["medical.appointment"].browse(
                appointment_id
            ).write({"state": "cancelled"})

        return request.redirect("/my/appointments")

    # --------------------------------------------------------------
    # Waiting screen (public, anonymised)
    # --------------------------------------------------------------

    @http.route(
        "/waiting-screen",
        type="http",
        auth="public",
        website=True,
    )
    def waiting_screen(self, **kw):
        """Public waiting-area display.

        Shows queue numbers, doctor names, and appointment
        times. Patient names are NOT exposed for privacy.
        """
        user_tz = self._get_user_tz()
        now_utc = datetime.utcnow()
        now_local = (
            pytz.utc.localize(now_utc).astimezone(user_tz)
        )

        today_start = (
            now_local.replace(
                hour=0, minute=0, second=0,
                microsecond=0,
            )
            .astimezone(pytz.utc)
            .replace(tzinfo=None)
        )
        today_end = (
            now_local.replace(
                hour=23, minute=59, second=59,
                microsecond=0,
            )
            .astimezone(pytz.utc)
            .replace(tzinfo=None)
        )

        appointments = (
            request.env["medical.appointment"]
            .sudo()
            .search(
                [
                    (
                        "appointment_date",
                        ">=",
                        today_start,
                    ),
                    (
                        "appointment_date",
                        "<=",
                        today_end,
                    ),
                    (
                        "state",
                        "in",
                        ["confirmed", "in_progress"],
                    ),
                ],
                order="appointment_date asc",
            )
        )

        queue = []
        for idx, appt in enumerate(appointments, start=1):
            local_dt = (
                pytz.utc
                .localize(appt.appointment_date)
                .astimezone(user_tz)
            )
            queue.append({
                "queue_number": idx,
                "doctor_name": appt.doctor_id.name,
                "time": local_dt.strftime("%I:%M %p"),
                "state": appt.state,
            })

        return request.render(
            "sp_physiotherapy.waiting_screen_template",
            {
                "queue": queue,
                "now": now_local.strftime(
                    "%d %b %Y  %I:%M %p"
                ),
            },
        )
