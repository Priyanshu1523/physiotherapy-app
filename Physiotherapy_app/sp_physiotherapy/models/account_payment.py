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


class AccountPayment(models.Model):
    """Extend account.payment with treatment fields."""

    _inherit = "account.payment"

    treatment_name = fields.Char(
        string="Treatment Done",
    )
    treatment_cost = fields.Float(
        string="Actual Cost",
    )
    amount_due = fields.Float(
        string="Balance",
        compute="_compute_amount_due",
    )

    @api.depends("partner_id")
    def _compute_amount_due(self):
        Move = self.env["account.move"]
        for rec in self:
            if not rec.partner_id:
                rec.amount_due = 0.0
                continue
            invoices = Move.search([
                (
                    "partner_id", "=",
                    rec.partner_id.id,
                ),
                ("move_type", "=", "out_invoice"),
                (
                    "is_treatment_invoice", "=",
                    True,
                ),
                ("state", "=", "posted"),
                ("payment_state", "!=", "paid"),
            ])
            total = sum(
                inv.amount_total for inv in invoices
            )
            paid = sum(
                inv.amount_total - inv.amount_residual
                for inv in invoices
            )
            rec.amount_due = total - paid
