import { z } from "zod";

export const reorderPhotosSchema = z.object({
  photoIds: z
    .array(z.string().min(1, "사진 ID가 필요합니다."))
    .min(1, "정렬할 사진이 없습니다."),
});
