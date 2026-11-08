import json
import logging

import pytz
import requests

from odoo import _, api, models

_logger = logging.getLogger(__name__)


class ZoomMeetingService(models.AbstractModel):
    """Zoom meeting integration for video consultations."""

    _name = "zoom.meeting.service"
    _description = "Zoom Meeting Service"

    @api.model
    def _get_zoom_config(self):
        """Retrieve Zoom config from system parameters."""
        get_param = (
            self.env["ir.config_parameter"].sudo().get_param
        )
        return {
            "enabled": get_param(
                "sp_physiotherapy.zoom_enabled", "False"
            ) == "True",
            "client_id": get_param(
                "sp_physiotherapy.zoom_client_id", ""
            ),
            "client_secret": get_param(
                "sp_physiotherapy.zoom_client_secret", ""
            ),
            "account_id": get_param(
                "sp_physiotherapy.zoom_account_id", ""
            ),
        }

    @api.model
    def _get_access_token(self):
        """Get OAuth token using Server-to-Server credentials."""
        config = self._get_zoom_config()

        if not all([
            config["client_id"],
            config["client_secret"],
            config["account_id"],
        ]):
            return None

        try:
            resp = requests.post(
                "https://zoom.us/oauth/token",
                params={
                    "grant_type": "account_credentials",
                    "account_id": config["account_id"],
                },
                auth=(
                    config["client_id"],
                    config["client_secret"],
                ),
                timeout=30,
            )
            resp.raise_for_status()
            return resp.json().get("access_token")
        except Exception as e:
            _logger.error(
                "Zoom OAuth failed: %s", str(e)
            )
            return None

    @api.model
    def create_meeting(self, appointment):
        """Create a Zoom meeting for an appointment.

        Args:
            appointment: medical.appointment record.

        Returns:
            dict with join_url, meeting_id or error.
        """
        config = self._get_zoom_config()
        if not config["enabled"]:
            _logger.info("Zoom disabled. Skipping.")
            return {"status": "disabled"}

        token = self._get_access_token()
        if not token:
            _logger.warning(
                "Zoom not configured. Set credentials in"
                " Settings > Physiotherapy."
            )
            return {"status": "not_configured"}

        duration = int(appointment.slot_duration)

        # FIX Z2: appointment_date is stored as UTC (naive).
        # The Zoom API ignores the `timezone` field when the
        # start_time ends with "Z" (UTC indicator). Convert to
        # the user's local timezone and omit the "Z" suffix so
        # that Zoom correctly applies the timezone field.
        tz_name = self.env.user.tz or "UTC"
        user_tz = pytz.timezone(tz_name)
        aware_utc = pytz.utc.localize(
            appointment.appointment_date
        )
        local_dt = aware_utc.astimezone(user_tz)
        start_time = local_dt.strftime("%Y-%m-%dT%H:%M:%S")

        meeting_data = {
            "topic": _(
                "Consultation - %(patient)s with"
                " Dr. %(doctor)s"
            ) % {
                         "patient": appointment.patient_id.name,
                         "doctor": appointment.doctor_id.name,
                     },
            "type": 2,  # Scheduled meeting
            "start_time": start_time,
            "duration": duration,
            "timezone": tz_name,
            "settings": {
                "host_video": True,
                "participant_video": True,
                "join_before_host": False,
                "waiting_room": True,
                "mute_upon_entry": True,
            },
        }

        try:
            resp = requests.post(
                "https://api.zoom.us/v2/users/me/meetings",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                data=json.dumps(meeting_data),
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()

            result = {
                "status": "created",
                "join_url": data.get("join_url", ""),
                "meeting_id": str(
                    data.get("id", "")
                ),
                "start_url": data.get("start_url", ""),
                "password": data.get("password", ""),
            }

            _logger.info(
                "Zoom meeting created for %s: %s",
                appointment.appointment_no,
                result["meeting_id"],
            )
            return result

        except Exception as e:
            _logger.error(
                "Zoom meeting creation failed: %s",
                str(e),
            )
            return {"status": "error", "error": str(e)}

    @api.model
    def delete_meeting(self, meeting_id):
        """Delete a Zoom meeting by ID."""
        config = self._get_zoom_config()
        if not config["enabled"] or not meeting_id:
            return

        token = self._get_access_token()
        if not token:
            return

        try:
            url = (
                    "https://api.zoom.us/v2/meetings/"
                    + str(meeting_id)
            )
            # FIX Z3: Check the HTTP response status code.
            # Previously, non-2xx responses (403, 404, 429)
            # were silently discarded with no log entry.
            resp = requests.delete(
                url,
                headers={
                    "Authorization": f"Bearer {token}",
                },
                timeout=30,
            )
            if resp.status_code not in (200, 204):
                _logger.warning(
                    "Zoom meeting deletion returned HTTP %s"
                    " for meeting %s.",
                    resp.status_code,
                    meeting_id,
                )
        except Exception as e:
            _logger.warning(
                "Zoom meeting deletion failed: %s",
                str(e),
            )
