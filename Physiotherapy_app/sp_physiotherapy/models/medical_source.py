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

class MedicalSource(models.Model):
    """Patient referral source."""

    _name = "medical.source"
    _description = "Patient Source"

    name = fields.Char(
        string="Name",
        required=True,
        help="e.g. Referral, Website, Walk-in",
    )
