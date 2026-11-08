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

class MedicineFrequency(models.Model):
    """Medicine frequency / dosage instruction."""

    _name = "medicine.frequency"
    _description = "Medicine Frequency"

    code = fields.Char(string="Code", required=True)
    name = fields.Char(
        string="Description",
        required=True,
    )
