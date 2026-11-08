# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology (<>).
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

import logging
from datetime import timedelta

from odoo import api, fields, models

_logger = logging.getLogger(__name__)


class AppointmentReminder(models.Model):
    """Extend appointment model with reminder cron logic."""

    _inherit = "medical.appointment"

    reminder_sent = fields.Boolean(
        default=False,
        copy=False,
        string="Reminder Sent",
    )

    @api.model
    def _cron_send_reminders(self):
        """Send SMS and email reminders for appointments.

        Called by ir.cron every hour. Sends reminders for
        appointments within the configured reminder window
        (default 24 hours).
        """
        get_param = (
            self.env["ir.config_parameter"]
            .sudo()
            .get_param
        )
        hours = int(
            get_param(
                "sp_physiotherapy.reminder_hours", "24"
            )
        )

        now = fields.Datetime.now()
        window_end = now + timedelta(hours=hours)

        appointments = self.search([
            ("state", "=", "confirmed"),
            ("appointment_date", ">=", now),
            ("appointment_date", "<=", window_end),
            ("reminder_sent", "=", False),
        ])

        _logger.info(
            "Reminder cron: window %s to %s UTC (%s h), "
            "%d appointment(s) matched.",
            now,
            window_end,
            hours,
            len(appointments),
        )
        if not appointments:
            return

        _logger.info(
            "Sending reminders for %d appointments.",
            len(appointments),
        )

        sms_service = self.env["twilio.sms.service"]
        mail_template = self.env.ref(
            "sp_physiotherapy"
            ".mail_template_appointment_confirmed",
            raise_if_not_found=False,
        )

        for appt in appointments:
            delivered = False

            # Send SMS reminder
            try:
                result = sms_service.send_appointment_reminder(
                    appt
                )
                if (result or {}).get("status") == "sent":
                    delivered = True
            except Exception as e:
                _logger.warning(
                    "SMS reminder failed for %s: %s",
                    appt.appointment_no,
                    str(e),
                )

            # Send email reminder
            if (
                mail_template
                and appt.patient_id.email
            ):
                try:
                    mail_template.sudo().send_mail(
                        appt.id, force_send=True
                    )
                    delivered = True
                except Exception as e:
                    _logger.warning(
                        "Email reminder failed for"
                        " %s: %s",
                        appt.appointment_no,
                        str(e),
                    )

            # Mark as sent only if at least one channel worked,
            # so a missing/failed SMS setup is retried next hour.
            if delivered:
                appt.sudo().write(
                    {"reminder_sent": True}
                )

        _logger.info(
            "Reminders sent for %d appointments.",
            len(appointments),
        )