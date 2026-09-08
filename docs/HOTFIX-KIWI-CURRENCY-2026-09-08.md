# Kiwi MCP currency hotfix — 8 Sep 2026

Production probes for BLR→SIN on 2026-10-08 returned exact-cabin Kiwi MCP inventory while the structured provider currency was EUR even though CreditIQ requested INR. CreditIQ financial surfaces assume the cash-flight search endpoint's normalized price is INR, so accepting those numbers would mislabel EUR as INR.

Safety decision: reject Kiwi MCP pricing unless the structured payload explicitly reports INR. Do not convert with an inferred or unsourced FX rate. Fall through to the next provider instead.
