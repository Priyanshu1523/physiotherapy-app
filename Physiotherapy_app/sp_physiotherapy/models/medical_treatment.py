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

class MedicalTreatment(models.Model):
    """Medical treatment details."""

    _name = "medical.treatment"
    _description = "Medical Treatment"

    name = fields.Char(
        string="Treatment Name",
        required=True,
    )
    treatment_category_id = fields.Many2one(
        comodel_name="treatment.category",
        string="Category",
        ondelete="set null",
    )
    cost = fields.Float(string="Treatment Cost")
