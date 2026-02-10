import { z } from "zod"

export const offModalSchema = z.discriminatedUnion("category", [
  z.object({
    category: z.literal("leave"),
    staffName: z.string().min(1, { message: "직원을 선택해주세요." }),
    date: z.date({
      message: "날짜를 선택해주세요.",
    }),
    leaveType: z.enum(["종일", "오전", "오후"], {
      message: "연차 타입을 선택해주세요.",
    }),
    memo: z.string().optional(),
  }),
  z.object({
    category: z.literal("off"),
    staffName: z.string().min(1, { message: "직원을 선택해주세요." }),
    date: z.date({
      message: "날짜를 선택해주세요.",
    }),
    memo: z.string().optional(),
  }),
])

export type OffModalFormValues = z.infer<typeof offModalSchema>
