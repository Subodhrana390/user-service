import { z } from "zod";

export const reviewApplicationSchema = z
    .object({
        status: z.enum(["approved", "rejected"]),
        rejectionReason: z.string().min(5).optional(),
    })
    .superRefine((data, ctx) => {
        if (data.status === "rejected" && !data.rejectionReason) {
            ctx.addIssue({
                path: ["rejectionReason"],
                message: "Rejection reason is required when rejecting",
                code: z.ZodIssueCode.custom,
            });
        }
    });

export type ReviewApplicationInput = z.infer<typeof reviewApplicationSchema>;
