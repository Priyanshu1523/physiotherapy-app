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

class MedicalWorkingDay(models.Model):
    """Working day configuration for shifts."""

    _name = "medical.working.day"
    _description = "Medical Working Day"
    _order = "sequence"

    name = fields.Char(string="Day", required=True)
    sequence = fields.Integer(default=10)
    code = fields.Selection(
        selection=[
            ("0", "Monday"),
            ("1", "Tuesday"),
            ("2", "Wednesday"),
            ("3", "Thursday"),
            ("4", "Friday"),
            ("5", "Saturday"),
            ("6", "Sunday"),
        ],
        string="Day Code",
    )
