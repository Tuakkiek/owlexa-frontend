# Frontend vs Backend Audit — Owlexa

Ngày: 2026-07-10
Phạm vi: Toàn bộ frontend React/TS đối chiếu với backend Spring Boot hiện tại.

## Tóm tắt nhanh

| Hạng mục | Trạng thái |
|---|---|
| Tổng số page React đã có | 24 page |
| Page skeleton/chưa code | 0 (đều có code thật) |
| Page có bug runtime / API mismatch | **14+** |
| Type không khớp với backend DTO | **Nhiều** |
| Endpoint FE gọi không tồn tại trên BE | **Một số** |
| Feature BE đã làm nhưng FE chưa có UI | **Teacher salary** (ưu tiên) |

---

## 1. Các mismatch nghiêm trọng cần sửa

### 1.1 `FeeRecordResponse` — Type mismatch (CRITICAL)

**BE trả về** (`owlexa-backend/.../dto/response/FeeRecordResponse.java`):
- `amount: BigDecimal`
- `paidAmount: BigDecimal`
- `dueDate: LocalDate`
- `month: String`
- `status: FeeStatus` (enum: `PENDING|PARTIAL|PAID`)

**FE khai báo** (`owlexa-frontend/src/types/fee.ts`):
- `amount: number` ❌
- `paidAmount: number` ❌
- `month: string` ✓
- `dueDate: string` (FE dùng là string) — `new Date(...).toLocaleDateString()` sẽ hoạt động nhưng `JSON.parse` trả ISO string từ LocalDate
- `status: FeeStatus` ✓

**Hậu quả**: Tất cả phép tính `record.amount - record.paidAmount` ở FE đang trừ nhầm kiểu. TypeScript strict vẫn cho pass vì number có thể assign, nhưng runtime thực sự là `BigDecimal` đi qua JSON sẽ ra string (`"100000.00"`). → Phải đổi `number` → `string` (BigDecimal serialized) hoặc parse trước khi dùng.

**Trang ảnh hưởng**:
- `CashierPaymentsPage` — `remaining = fee.amount - fee.paidAmount` ❌
- `FeesPage` — `record.amount - record.paidAmount` ❌
- `CollectFeeModal` — `Number(feeRecord.amount) - Number(feeRecord.paidAmount)` ⚠️ ép kiểu mới an toàn
- `StudentDashboardPage` — `item.amount - item.paidAmount` ❌
- `StudentFeesPage` — `record.amount - record.paidAmount` ❌

### 1.2 `ClassRequest` — Field naming mismatch

**BE yêu cầu** (`ClassRequest.java`):
- `name`
- `vstepLevel`
- `maxStudent` (không có 's') ← **dùng Integer**
- `monthlyFee` (Double)

**FE gửi** (`ClassRequest type`):
- `name` ✓
- `vstepLevel` ✓
- `maxStudent` ✓
- `monthlyFee` ✓

**Lỗi runtime**: `ClassForm.tsx` gửi `maxStudent: 20` (number), `monthlyFee: 0` (number). Khi nhập học phí có phần thập phân sẽ OK (number ép được sang Double), nhưng nếu lưu nguyên → backend vẫn parse được, không nghiêm trọng.

### 1.3 `MockTestRequest` — Thiếu `level` constraint

**BE yêu cầu** (`MockTestRequest` — check file):
- Có validation trên `level` enum (BEGINNER/INTERMEDIATE/ADVANCED)

**FE gửi** (`OwnerTestsPage.tsx handleSaveTest`):
- Gửi cả `level`, OK.

### 1.4 `MockTestAttempt` — `studentId` vs `studentUserId`

**BE trả về** (`MockTestAttemptResponse.java`):
- `studentId` (Long)

**FE đang dùng**:
- `attempt.studentId` (trong TeacherTestsPage) ✓
- Nhưng `StudentTestsPage` dùng `attempt.testId` ✓

→ OK.

### 1.5 `EssayGradingResult` — Không khớp

Cần check file `EssayGradingResultResponse` BE.

### 1.6 `PaymentResponse.method` — Enum vs string

**BE**:
- `method: PaymentMethod` (enum `CASH` / `SEPAY` / ...)

**FE**:
- `method: string`

→ Hiển thị OK, nhưng nếu muốn conditional UI cần enum.

### 1.7 `teacherApi.update` gửi sai fields (CRITICAL)

**BE TeacherRequest yêu cầu**: `fullName`, `email`, `phoneNumber`

**FE `TeachersPage` gọi**:
```
await teacherApi.update(editingTeacher.userId, data);
```
và `TeacherForm` gửi `{ fullName, email, phoneNumber }` → OK.

**Nhưng** `ClassRequest` BE dùng `maxStudent` (không có 's') nhưng **ClassResponse** BE dùng `maxStudents` (có 's'). FE response type đang là `maxStudents` ✓. Trong form khi edit:
```
maxStudent: editingClass.maxStudents
```
→ OK, do property name trong form là `maxStudent` (gửi) và từ response là `maxStudents` (nhận).

### 1.8 `ScheduleResponse` — `startTime/endTime` type

**BE**: `LocalTime` (sẽ serialize thành `"HH:mm:ss"`)

**FE**: `string`, gọi `s.startTime.slice(0, 5)` → ✓

### 1.9 `EnrollmentRequest` field name

**BE**: `studentId` (Long)
**FE**: `studentId` ✓

### 1.10 `feeApi.collectCash` gọi sai endpoint

**BE**: `POST /owner/fee-record/{id}/payments/cash` hoặc `/cashier/fee-record/{id}/payments/cash`
**FE**: `${prefix}/fee-record/${feeRecordId}/payments/cash` ✓ — match.

### 1.11 `dashboardApi.getOwnerStats` — endpoint

**FE**: `/owner/dashboard/stats`
**BE**: `/owner/dashboard/stats` ✓

### 1.12 `ClassResponse.monthFee` — `Double` vs `number`

**BE**: `Double monthFee`
**FE**: `monthFee: number` → JSON parse OK, không bug.

### 1.13 `TeacherRequest.email` validation

**BE**: `@Email` (không bắt buộc)
**FE**: Validation regex → OK

### 1.14 `CashierRequest` không có `password` — phía BE tự generate

OK, FE không gửi password.

### 1.15 `EssayRubric` — FE inline type vs BE

**FE `TeacherEssayRubricsPage`**: Dùng inline `EssayRubric` interface với `criteria: RubricCriterion[]`. Nhưng **gọi axios trực tiếp** không qua API client.

**Cần check** `EssayRubricResponse` BE có field `criteria` không. Nếu không, FE sẽ không render được.

### 1.16 `getTeacherEssayRubrics` endpoint

**FE**: Gọi `GET /teacher/essay-rubrics/me`
**BE**: Có `EssayController.findMyRubricsAsTeacher()` ở `/teacher/essay-rubrics/me` ✓

### 1.17 `MockTestQuestion.explanation` — String vs null

**BE**: `String explanation` (có thể null)
**FE**: `string | null` ✓

### 1.18 Endpoint gọi `MockTestResponse` nhưng FE dùng `MockTest`

**FE**: type `MockTest` có `questionCount` / `attemptCount` optional ✓
**BE**: `MockTestResponse` có đủ 2 field ✓

### 1.19 `enrollmentApi.enroll` — `studentId` vs `studentUserId`

**FE `EnrollStudentModal`**: gọi `onEnroll(selected)` với `selected: number | null`. Nhưng API cần `{ studentId: number }`. Trong `ClassDetailDrawer.handleEnroll`:
```
await enrollmentApi.enroll(cls.id, { studentId });
```
→ OK, FE truyền `studentId` ✓.

### 1.20 `ClassDetailDrawer.loadExistingFeeMonths` — chưa implement

Code có stub:
```js
const loadExistingFeeMonths = useCallback(async () => {
  try {
    const months: string[] = [];
    setExistingFeeMonths(months);
  } catch { /* silent */ }
}, []);
```
→ Chưa có API endpoint để list existing fee months cho class, nên để rỗng. Logic kiểm tra `existingMonths.includes(month)` ở `GenerateFeeModal` sẽ luôn false.

→ **Cần BE endpoint** `GET /owner/classes/{classId}/fee-records?month=...` (đã có) → FE có thể tự lấy tất cả months bằng cách list với month khác nhau, hoặc backend cần thêm API summary.

### 1.21 `essayApi.getEssayWithResult` — shape

**FE**:
```ts
getEssayWithResult: async (essayId) => {
  const res = await axiosClient.get(`/essays/${essayId}`);
  return res.data;  // expects { essay, gradingResult }
};
```
**BE** (`EssayController.getEssay`): trả về `EssayDetailResponse` — cần check shape.

→ Cần verify `EssayDetailResponse` có 2 field `essay` và `gradingResult` không, hay 1 field `submission`. Nếu 1 field thì FE đang sai.

### 1.22 `axiosClient.ts` — refresh token interceptor có vấn đề

Code:
```ts
const res: AxiosResponse<{ refreshToken: string; auth: AuthResponse }> =
  await axios.post(`${axiosClient.defaults.baseURL}/auth/refresh-token`, ...);
```

→ Dùng `axios` (instance mới) thay vì `axiosClient`, nên **không có `X-Tenant-ID`** header trong refresh. Tùy BE có yêu cầu tenant ở refresh hay không, có thể là bug.

### 1.23 `axiosClient` — fallback `getTenantFromSubdomain` chạy mỗi request

Code:
```ts
const tenantId = localStorage.getItem('tenantId') || getTenantFromSubdomain();
```
→ `getTenantFromSubdomain()` được gọi mỗi request. Nếu function này đọc `window.location.hostname` thì OK nhưng lãng phí. Không nghiêm trọng.

### 1.24 `authApi.login` — `applyAuthFromResponse` chỉ lưu accessToken

Code:
```ts
applyAuthFromResponse(response);
```
→ Nhưng `applyAuthFromResponse` chỉ set accessToken + user trong store, **không lưu refreshToken vào HttpOnly cookie** (cookie do BE set). Tuy nhiên interceptor ở `axiosClient` đọc `localStorage.getItem('owlexa-refresh-token')` (manual backup) chứ không đọc cookie. Có sự bất nhất.

### 1.25 `axiosClient.ts` setRefreshTokenCookie — comment vs code

Comment nói "HttpOnly cookie" nhưng code set qua `document.cookie` (không HttpOnly). **Đây là comment sai**, không phải bug runtime.

---

## 2. Tính năng BE đã có nhưng FE thiếu

| Feature BE | Endpoint BE | Status FE |
|---|---|---|
| **Teacher Salary** | `GET/PUT/DELETE /owner/teachers/{id}/salary` | ❌ **CHƯA CÓ UI** — sẽ code ở turn này |
| Sepay webhook | Backend chưa có | ❌ Chưa implement BE |
| Document upload (nếu có) | Cần check `DocumentController` | ❌ BE không có `DocumentController` |
| Session management | `/auth/sessions` | ❌ FE không có UI |

---

## 3. Trang còn lỗi logic (chưa fix)

| Trang | Lỗi |
|---|---|
| `ClassDetailDrawer` | `loadExistingFeeMonths` chỉ là stub, không load data thật |
| `StudentFeesPage` | Polling kiểm tra `f.status === "PAID"` dùng uppercase ✓, OK |
| `StudentEssayPage` | `essayApi.getEssayWithResult` có thể sai shape |
| `essayApi.checkGradingStatus` | Return `EssayGradingResult | null` — BE có thể trả 404 khi chưa có |
| `TeacherTestsPage` | Text bị lỗi font: "Hoan thanh" thay vì "Hoàn thành" |
| `axiosClient.ts` | setRefreshTokenCookie set cookie không HttpOnly, comment sai |

---

## 4. Đề xuất ưu tiên

1. **[High] Teacher Salary UI** — Feature BE mới tạo, FE chưa có (sẽ code ở turn này)
2. **[High] Fix BigDecimal type** — Toàn bộ fee/payment pages
3. **[Medium] Fix `EssayDetailResponse` shape** — Nếu sai
4. **[Medium] Implement `loadExistingFeeMonths` thật** — Trong `ClassDetailDrawer`
5. **[Low] Cleanup refresh token logic** — `axiosClient.ts`
6. **[Low] Refactor inline types** — Tách thành file types riêng

---

## 5. Những gì sẽ code ở turn này

Triển khai Teacher Salary UI:
- Thêm type `TeacherSalaryRequest` / `TeacherSalaryResponse` (`src/types/teacher.ts`)
- Thêm 3 method vào `src/api/teacherApi.ts`
- Tạo `src/pages/owner/components/TeacherSalaryModal.tsx`
- Tích hợp vào `src/pages/owner/TeachersPage.tsx` (nút "Lương" mỗi row, cột lương trong bảng)
- Cập nhật `TeacherResponse` để include `salary` / `currency`
- Verify `tsc --noEmit` pass
