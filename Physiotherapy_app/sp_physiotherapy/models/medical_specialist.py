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


class MedicalSpecialist(models.Model):
    """Medical specialization for doctors."""

    _name = "medical.specialist"
    _description = "Medical Specialization"
    _order = "name"

    name = fields.Char(string="Name", required=True)
    code = fields.Char(string="Code")
