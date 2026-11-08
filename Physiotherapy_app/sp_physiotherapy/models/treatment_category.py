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

class TreatmentCategory(models.Model):
    """Treatment category grouping."""

    _name = "treatment.category"
    _description = "Treatment Category"

    name = fields.Char(string="Name", required=True)
