# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology (<>).
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

from odoo import fields, models

class ResConfigSettings(models.TransientModel):
    """Settings for Twilio SMS and Zoom integration."""

    _inherit = "res.config.settings"

    twilio_account_sid = fields.Char(
        string="Twilio Account SID",
        config_parameter=(
            "sp_physiotherapy.twilio_account_sid"
        ),
    )
    twilio_auth_token = fields.Char(
        string="Twilio Auth Token",
        config_parameter=(
            "sp_physiotherapy.twilio_auth_token"
        ),
    )
    twilio_phone_number = fields.Char(
        string="Twilio Phone Number",
        config_parameter=(
            "sp_physiotherapy.twilio_phone_number"
        ),
    )
    twilio_enabled = fields.Boolean(
        string="Enable Twilio SMS",
        config_parameter=(
            "sp_physiotherapy.twilio_enabled"
        ),
    )

    zoom_client_id = fields.Char(
        string="Zoom Client ID",
        config_parameter=(
            "sp_physiotherapy.zoom_client_id"
        ),
    )
    zoom_client_secret = fields.Char(
        string="Zoom Client Secret",
        config_parameter=(
            "sp_physiotherapy.zoom_client_secret"
        ),
    )
    zoom_account_id = fields.Char(
        string="Zoom Account ID",
        config_parameter=(
            "sp_physiotherapy.zoom_account_id"
        ),
    )
    zoom_enabled = fields.Boolean(
        string="Enable Zoom",
        config_parameter=(
            "sp_physiotherapy.zoom_enabled"
        ),
    )

    appointment_reminder_hours = fields.Integer(
        string="Send Reminder (Hours Before)",
        default=24,
        config_parameter=(
            "sp_physiotherapy.reminder_hours"
        ),
    )
