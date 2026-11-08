# -*- coding: utf-8 -*-
#########################################################################################
#
#    OpenERP, Open Source Management Solution
#    Copyright (C) Supriya Technology (<>).
#
#    For Module Support : chauhanpriyanshu011@gmail.com
#
##########################################################################################

from odoo import api, fields, models

class MedicalTimeShift(models.Model):
    """Shift management with working days."""

    _name = "medical.time.shift"
    _description = "Medical Time Shift"
    _rec_name = "name"

    name = fields.Char(
        string="Name")
    shift_type = fields.Selection(
        selection=[
            ("morning", "Morning"),
            ("afternoon", "Afternoon"),
            ("evening", "Evening"),
            ("night", "Night"),
        ],
        string="Shift Type",
    )
    start_time = fields.Float(string="Start Time")
    end_time = fields.Float(string="End Time")
    slot_duration = fields.Selection(
        selection=[
            ("15", "15 Minutes"),
            ("30", "30 Minutes"),
            ("60", "1 Hour"),
        ],
        string="Slot Duration",
        default="30",
        required=True,
    )
    max_appointments = fields.Integer(
        string="Max Appointments",
        default=10,
    )
    working_day_ids = fields.Many2many(
        comodel_name="medical.working.day",
        string="Working Days",
    )

    # ----------------------------------------------------------
    # Helpers
    # ----------------------------------------------------------

    @staticmethod
    def _float_to_time_string(value):
        """Convert a float like 8.5 to '8:30 AM'."""
        hours = int(value)
        minutes = int(round((value - hours) * 60))
        suffix = "AM" if hours < 12 else "PM"
        display_hour = hours % 12 or 12
        return "%d:%02d %s" % (display_hour, minutes, suffix)

    # ----------------------------------------------------------
    # CRUD
    # ----------------------------------------------------------

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for rec in records:
            rec.name = "%s - %s" % (
                self._float_to_time_string(rec.start_time),
                self._float_to_time_string(rec.end_time),
            )
        return records

    def write(self, vals):
        res = super().write(vals)
        if "start_time" in vals or "end_time" in vals:
            for rec in self:
                rec.name = "%s - %s" % (
                    self._float_to_time_string(rec.start_time),
                    self._float_to_time_string(rec.end_time),
                )
        return res

    # ----------------------------------------------------------
    # Onchange
    # ----------------------------------------------------------

    @api.onchange("start_time", "end_time")
    def _onchange_time(self):
        for rec in self:
            rec.name = "%s - %s" % (
                self._float_to_time_string(
                    rec.start_time
                ),
                self._float_to_time_string(
                    rec.end_time
                ),
            )
