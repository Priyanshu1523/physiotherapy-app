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


class AccountMove(models.Model):
    """Extend account.move for treatment invoices."""

    _inherit = "account.move"

    is_treatment_invoice = fields.Boolean(
        string="Treatment Invoice",
        default=False,
    )
