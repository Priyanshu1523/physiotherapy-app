import logging
import re

from odoo import _, api, models

_logger = logging.getLogger(__name__)


class TwilioSmsService(models.AbstractModel):
    """Twilio SMS integration for appointment notifications."""

    _name = "twilio.sms.service"
    _description = "Twilio SMS Service"

    @api.model
    def _get_twilio_config(self):
        """Retrieve Twilio configuration from system parameters."""
        get_param = (
            self.env["ir.config_parameter"].sudo().get_param
        )
        return {
            "enabled": get_param(
                "sp_physiotherapy.twilio_enabled", "False"
            ) == "True",
            "account_sid": get_param(
                "sp_physiotherapy.twilio_account_sid", ""
            ),
            "auth_token": get_param(
                "sp_physiotherapy.twilio_auth_token", ""
            ),
            "from_number": get_param(
                "sp_physiotherapy.twilio_phone_number", ""
            ),
        }

    @api.model
    def _normalize_phone(self, phone):
        """Normalize a phone number to E.164 format.

        The country prefix is read from the
        'sp_physiotherapy.twilio_country_code' system parameter
        (default '+91' for backward-compatibility).  Set this
        parameter to the correct country code (e.g. '+44', '+1')
        for non-India deployments.
        """
        phone = (phone or "").strip()
        if not phone:
            return phone
        # Twilio needs plain E.164: keep digits and a leading "+".
        has_plus = phone.startswith("+")
        phone = re.sub(r"\D", "", phone)
        if has_plus:
            phone = "+" + phone
        if not phone.startswith("+"):
            country_code = (
                self.env["ir.config_parameter"]
                .sudo()
                .get_param(
                    "sp_physiotherapy.twilio_country_code",
                    "+91",
                )
            )
            phone = country_code + phone.lstrip("0")
        return phone

    @api.model
    def send_sms(self, to_number, message):
        """Send SMS via Twilio API.

        Args:
            to_number: Recipient phone (E.164 format).
            message: SMS body text.

        Returns:
            dict with status and message_sid or error.
        """
        config = self._get_twilio_config()
        if not config["enabled"]:
            _logger.info("Twilio SMS disabled. Skipping.")
            return {"status": "disabled"}

        if not all([
            config["account_sid"],
            config["auth_token"],
            config["from_number"],
        ]):
            _logger.warning(
                "Twilio not configured. Set credentials in"
                " Settings > Physiotherapy."
            )
            return {"status": "not_configured"}

        try:
            from twilio.rest import Client
        except ImportError:
            _logger.error(
                "twilio package not installed."
                " Run: pip install twilio"
            )
            return {
                "status": "error",
                "error": "twilio not installed",
            }

        try:
            client = Client(
                config["account_sid"],
                config["auth_token"],
            )
            to_number = self._normalize_phone(to_number)
            sms = client.messages.create(
                body=message,
                from_=self._normalize_phone(config["from_number"]),
                to=to_number,
            )
            _logger.info(
                "SMS sent to %s (SID: %s)",
                to_number,
                sms.sid,
            )
            return {
                "status": "sent",
                "message_sid": sms.sid,
            }
        except Exception as e:
            _logger.error(
                "Failed to send SMS to %s: %s",
                to_number,
                str(e),
            )
            return {"status": "error", "error": str(e)}

    @api.model
    def send_appointment_reminder(self, appointment):
        """Send appointment reminder SMS to patient."""
        if not appointment.patient_id.phone:
            return {"status": "no_phone"}

        # FIX T2: Use shared _normalize_phone() instead of
        # duplicating the normalization logic here.
        phone = self._normalize_phone(
            appointment.patient_id.phone
        )

        message = _(
            "Reminder: Your appointment (%(no)s) with"
            " Dr. %(doctor)s is scheduled for"
            " %(date)s. Please arrive 10 minutes"
            " early."
        ) % {
                      "no": appointment.appointment_no,
                      "doctor": appointment.doctor_id.name,
                      "date": appointment.appointment_date.strftime(
                          "%d %b %Y %I:%M %p"
                      ),
                  }
        return self.send_sms(phone, message)

    @api.model
    def send_appointment_confirmation(self, appointment):
        """Send appointment confirmation SMS."""
        if not appointment.patient_id.phone:
            return {"status": "no_phone"}

        # FIX T2: Use shared _normalize_phone() instead of
        # duplicating the normalization logic here.
        phone = self._normalize_phone(
            appointment.patient_id.phone
        )

        message = _(
            "Your appointment %(no)s with"
            " Dr. %(doctor)s on %(date)s has been"
            " confirmed."
        ) % {
                      "no": appointment.appointment_no,
                      "doctor": appointment.doctor_id.name,
                      "date": appointment.appointment_date.strftime(
                          "%d %b %Y %I:%M %p"
                      ),
                  }
        return self.send_sms(phone, message)