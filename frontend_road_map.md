# OWLEXA — Frontend Roadmap

**React TypeScript · Vite · Tailwind CSS · Axios · React Router v6**

Solo Developer · Căn theo Backend Roadmap · UI làm đẹp sau cùng

---

## Nguyên tắc xuyên suốt

**Functional first — Beautiful later.**
Hệ thống phải chạy đúng trước. UI chỉ cần dùng được trong Phase 1–4.
Toàn bộ việc làm đẹp tập trung vào Phase 5.

**Frontend không tự đặt rule.**
Mọi business logic nằm ở backend. Frontend chỉ gọi API, hiển thị dữ liệu, điều hướng.
Khi thấy cần check quyền hoặc validate phức tạp ở FE — đó là dấu hiệu backend chưa đủ.

**API contract trước, UI sau.**
Với mỗi tính năng, đọc Postman collection của backend trước khi viết một dòng JSX.
Không đoán cấu trúc response.

**Không làm song song với backend.**
FE bắt đầu khi backend phase tương ứng đã test xong bằng Postman.

---

## Cấu trúc thư mục mục tiêu

```
src/
├── api/                  # Axios instances, tất cả API call functions
│   ├── axiosClient.ts    # Base instance, interceptor
│   ├── authApi.ts
│   ├── classApi.ts
│   ├── feeApi.ts
│   ├── essayApi.ts
│   └── ...
├── components/
│   ├── ui/               # Các component tái sử dụng: Button, Input, Table, Modal...
│   └── layout/           # Sidebar, Header, Layout wrapper
├── pages/
│   ├── auth/             # Login, Register
│   ├── owner/            # Dashboard OWNER
│   ├── teacher/          # Dashboard TEACHER
│   ├── student/          # Portal STUDENT
│   ├── cashier/          # Dashboard CASHIER
│   └── admin/            # Dashboard ADMIN
├── hooks/                # Custom hooks: useAuth, useTenant, useCurrentUser
├── store/                # Zustand store: auth state, tenant state
├── types/                # TypeScript interfaces khớp với response DTO của backend
│   ├── auth.ts
│   ├── class.ts
│   ├── fee.ts
│   └── ...
├── utils/                # Format tiền, format ngày, helper functions
└── router/               # React Router config, ProtectedRoute
```

---

## Tổng quan 5 Phase

| Phase | Tên | Khi nào bắt đầu | Kết quả |
|-------|-----|-----------------|---------|
| **Phase 1** | Setup & Auth | Sau khi Backend Phase 1 xong | Đăng nhập được, có layout theo role |
| **Phase 2** | OWNER Dashboard | Sau khi Backend Phase 2 xong (ngày 16–50) | OWNER quản lý được toàn bộ |
| **Phase 3** | TEACHER + STUDENT | Sau khi Backend Phase 2 hoàn tất | 3 role dùng được hệ thống |
| **Phase 4** | AI + Thi thử | Sau khi Backend Phase 4 xong (ngày 76–90) | Essay và mock test hoạt động |
| **Phase 5** | UI Polish | Sau khi hệ thống ổn định end-to-end | Giao diện đủ đẹp để demo |

---

## Phase 1 — Setup & Auth Foundation

**Bắt đầu:** Sau khi backend Auth API test xong (backend ngày 7–15)
**Kết thúc khi:** Đăng nhập được với mọi role, sidebar hiển thị đúng theo role

### 1.1 Khởi tạo dự án

```bash
npm create vite@latest owlexa-frontend -- --template react-ts
cd owlexa-frontend
npm install
npm install react-router-dom axios zustand
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Chưa cần UI library phức tạp. Tailwind CSS thuần là đủ cho giai đoạn này.

### 1.2 Axios Client — làm đúng ngay từ đầu

File `src/api/axiosClient.ts` là trung tâm của toàn bộ tầng API.
Phải xử lý đúng 3 việc:

**Gắn Access Token vào mỗi request:**
```typescript
// Request interceptor
config.headers.Authorization = `Bearer ${getAccessToken()}`
```

**Gắn X-Tenant-ID vào mỗi request:**
```typescript
// Request interceptor
const tenantId = getTenantFromSubdomain() // đọc từ window.location.hostname
config.headers['X-Tenant-ID'] = tenantId
```

**Tự động refresh khi nhận 401:**
```typescript
// Response interceptor
// Nếu response là 401 → gọi POST /auth/refresh-token
// Nếu refresh thành công → retry request gốc với token mới
// Nếu refresh thất bại → xóa token, redirect về /login
```

> Interceptor refresh token là phần phức tạp nhất. Cần xử lý race condition
> khi nhiều request cùng nhận 401 một lúc (chỉ gọi refresh 1 lần, queue các request còn lại).

### 1.3 Auth State — Zustand Store

`src/store/authStore.ts` lưu:
- `accessToken: string | null` — **trong memory, không localStorage**
- `user: UserInfo | null` — thông tin user hiện tại
- `isAuthenticated: boolean`

Refresh token nằm trong HttpOnly Cookie (backend set), frontend không cần biết.
Khi reload trang → access token mất → gọi `/auth/refresh-token` ngay để lấy lại.

### 1.4 Trang Login

Chỉ cần form email + password, nút Submit.
Sau login → nhận `accessToken` + `user.role` → lưu vào store → redirect đúng dashboard theo role:

| Role | Redirect |
|------|----------|
| ADMIN | `/admin/dashboard` |
| OWNER | `/owner/dashboard` |
| TEACHER | `/teacher/dashboard` |
| STUDENT | `/student/dashboard` |
| CASHIER | `/cashier/dashboard` |

### 1.5 Protected Route + Role Guard

`src/router/ProtectedRoute.tsx`:
- Nếu chưa đăng nhập → redirect `/login`
- Nếu sai role → redirect `404` hoặc trang lỗi

```
/owner/*  → chỉ OWNER
/teacher/* → chỉ TEACHER
/student/* → chỉ STUDENT
/cashier/* → chỉ CASHIER
/admin/*  → chỉ ADMIN
```

### 1.6 Layout Skeleton

`src/components/layout/AppLayout.tsx`:
- Sidebar bên trái: menu item thay đổi theo role
- Header trên: tên user, nút logout
- Content area bên phải

UI giai đoạn này: **dùng được là đủ**. Màu sắc, font, spacing — để mặc định Tailwind.

### Checklist Phase 1

- [ ] Đăng nhập được với email/password
- [ ] Token lưu đúng chỗ (memory, không localStorage)
- [ ] Auto refresh token khi 401
- [ ] Redirect đúng dashboard theo role
- [ ] Logout xóa token, về trang login
- [ ] Protected route ngăn truy cập sai role
- [ ] X-Tenant-ID được gắn vào mọi request

---

## Phase 2 — OWNER Dashboard

**Bắt đầu:** Sau khi backend ngày 16–50 hoàn tất và test Postman xong
**Kết thúc khi:** OWNER quản lý được giáo viên, học sinh, lớp, học phí trên web

Thứ tự implement theo đúng phụ thuộc nghiệp vụ:

```
Teacher Management
    → Student Management
        → Class Management
            → Schedule
                → Attendance
                    → Fee Records
                        → Payment (Cash + Sepay)
```

### 2.1 Quản lý Giáo viên

**Trang danh sách** (`/owner/teachers`):
- Bảng: tên, số điện thoại, lớp đang dạy, trạng thái
- Nút Thêm giáo viên → mở form/modal

**Form thêm giáo viên:**
- Các field từ API `POST /centers/{centerId}/teachers`
- Validate client-side tối thiểu: không để trống field bắt buộc

**Thêm hàng loạt** (`POST /centers/{centerId}/teachers/bulk`):
- Cho phép nhập/paste nhiều số điện thoại
- Hiển thị kết quả trả về (phone + password tạm)

> Lưu ý: lương (`salary`) chỉ OWNER được thấy/sửa. Không render field này nếu role khác.

### 2.2 Quản lý Học sinh

**Trang danh sách** (`/owner/students`):
- Bảng: tên, số điện thoại, lớp đang học, trạng thái học phí
- Filter: theo lớp, theo trạng thái học phí (Đã đóng / Còn nợ / Sắp hạn)
- Tìm kiếm theo tên/số điện thoại

**Thêm hàng loạt** (`POST /centers/{centerId}/students/bulk`):
- Nhập số lượng hoặc paste danh sách
- Hiển thị file kết quả (phone + password) để in/gửi cho phụ huynh

### 2.3 Quản lý Lớp học

**Trang danh sách** (`/owner/classes`):
- Bảng: tên lớp, cấp độ VSTEP, sĩ số hiện tại / tối đa, học phí/tháng, giáo viên phụ trách
- Click vào lớp → vào trang chi tiết lớp

**Trang chi tiết lớp** (`/owner/classes/:classId`):
- Tab Danh sách học sinh
- Tab Lịch học
- Tab Học phí tháng này

**Tạo lớp mới:**
- Form: tên, cấp độ VSTEP, sĩ số tối đa, học phí/tháng
- Chọn giáo viên phụ trách

### 2.4 Thời khóa biểu

**Hiển thị lịch:**
- Dạng bảng 7 ngày × các buổi trong ngày
- Mỗi ô: tên lớp, phòng, giáo viên, ca học

Chưa cần calendar library phức tạp — bảng HTML thuần là đủ giai đoạn này.

### 2.5 Học phí & Thanh toán

**Danh sách hóa đơn** (`/owner/fees`):
- Lọc theo tháng, theo lớp, theo trạng thái (UNPAID / PARTIAL / PAID)
- Hiển thị: học sinh, lớp, tháng, số tiền, hạn đóng, trạng thái
- Nút nhắc nhở học sinh chưa đóng

**Thu học phí tiền mặt** (CASHIER cũng dùng màn này):
- Chọn học sinh → chọn hóa đơn còn nợ → nhập số tiền → xác nhận
- Gọi API `POST /payments` với `method: CASH`

**Xem lịch sử thanh toán:**
- Lọc theo ngày, theo học sinh, theo phương thức (CASH / SEPAY)

### 2.6 Báo cáo + Dashboard

**Dashboard OWNER** (`/owner/dashboard`):
- 4 thẻ số liệu: Doanh thu tháng này, Học sinh đang học, Học phí còn nợ, Số lớp đang chạy
- Danh sách học sinh chưa đóng học phí (top 10)
- Không cần chart phức tạp — số + bảng là đủ

### Checklist Phase 2

- [ ] CRUD Teacher (thêm đơn + hàng loạt)
- [ ] CRUD Student (thêm đơn + hàng loạt)
- [ ] CRUD Class
- [ ] Xem + tạo Schedule
- [ ] Xem danh sách hóa đơn, filter theo trạng thái
- [ ] Thu học phí tiền mặt (CASHIER flow)
- [ ] Dashboard 4 thẻ số liệu cơ bản

---

## Phase 3 — TEACHER Dashboard + STUDENT Portal

**Bắt đầu:** Sau khi Phase 2 frontend ổn định
**Kết thúc khi:** Teacher điểm danh được, Student xem lịch và đóng học phí online được

### 3.1 TEACHER — Lịch dạy

**Trang lịch** (`/teacher/schedule`):
- Bảng lịch tuần hiện tại
- Mỗi ô: tên lớp, phòng, thời gian

Không cần calendar library. Table HTML với 7 cột (T2–CN) là đủ.

### 3.2 TEACHER — Điểm danh

**Trang điểm danh** (`/teacher/attendance`):
- Chọn lớp → chọn ngày → hiển thị danh sách học sinh
- Mỗi học sinh: 3 nút radio/toggle → PRESENT / ABSENT / EXCUSED
- Nút Lưu → gọi API batch update attendance
- Sau khi lưu: hiển thị "Đã điểm danh [ngày] — [N học sinh có mặt / M vắng]"

### 3.3 TEACHER — Danh sách học sinh lớp mình

**Trang học sinh** (`/teacher/students`):
- Chọn lớp → xem danh sách
- Mỗi học sinh: tên, tỉ lệ chuyên cần tháng này, bài essay gần nhất

### 3.4 TEACHER — Soạn rubric Essay ★

**Trang rubric** (`/teacher/essay-criteria`):
- Chọn lớp → xem danh sách rubric đã tạo
- Tạo rubric mới: tiêu đề, mô tả chi tiết, điểm tối đa cho từng tiêu chí
- Đây là input để AI dùng chấm bài — cần mô tả **càng chi tiết càng tốt**

> Giao diện lúc này chỉ cần form textarea là đủ.
> Trải nghiệm người dùng sẽ được cải thiện ở Phase 5.

### 3.5 STUDENT — Lịch học

**Trang lịch** (`/student/schedule`):
- Hiển thị lịch tuần của học sinh này
- Mỗi buổi: tên lớp, phòng, giáo viên, thời gian

### 3.6 STUDENT — Học phí online

**Trang học phí** (`/student/fees`):
- Danh sách hóa đơn: tháng, số tiền, trạng thái
- Nút "Đóng học phí" → hiển thị QR Sepay
- Sau khi backend nhận Sepay webhook → trạng thái tự cập nhật
- Frontend: polling mỗi 5 giây hoặc dùng WebSocket nếu backend hỗ trợ

### 3.7 STUDENT — Thư viện tài liệu

**Trang tài liệu** (`/student/documents`):
- Lọc theo lớp
- Mỗi tài liệu: tên, loại (PDF/Video), ngày upload
- Click → mở URL Cloudinary trong tab mới

### 3.8 CASHIER Dashboard

**Trang thu học phí** (`/cashier/payments`):
- Tìm học sinh theo tên/SĐT
- Chọn hóa đơn còn nợ
- Nhập số tiền, xác nhận
- In phiếu thu (tính năng đơn giản, in trang hiện tại)

### Checklist Phase 3

- [ ] Teacher xem lịch dạy tuần
- [ ] Teacher điểm danh được (batch update)
- [ ] Teacher tạo rubric essay
- [ ] Student xem lịch học cá nhân
- [ ] Student xem và đóng học phí online qua Sepay
- [ ] Student xem tài liệu theo lớp
- [ ] Cashier thu học phí tiền mặt

---

## Phase 4 — AI Essay + Hệ thống thi thử

**Bắt đầu:** Sau khi Backend Phase 4 xong (backend ngày 76–90)
**Kết thúc khi:** Student nộp được essay, nhận kết quả AI, thi thử được

### 4.1 STUDENT — Nộp bài Essay

**Trang essay** (`/student/essays`):
- Chọn lớp → chọn rubric của giáo viên
- Textarea nhập bài (hỗ trợ paste)
- Nút "Nộp và chấm bài" → gọi `POST /essays/submit`
- **Loading state:** "AI đang chấm bài..." với spinner
  - Dự kiến mất 5–15 giây tùy độ dài bài
  - Không block UI, có thể polling `GET /essays/:id` mỗi 3 giây

**Trang kết quả essay:**
- Điểm tổng (ví dụ: 7.5/10)
- Điểm từng tiêu chí — dạng thanh progress
- Nhận xét của AI theo từng tiêu chí
- Nhận xét thủ công của giáo viên (nếu đã có)

### 4.2 TEACHER — Xem bài essay của học sinh

**Trang review** (`/teacher/essays`):
- Chọn lớp → danh sách bài đã nộp
- Mỗi bài: tên học sinh, ngày nộp, điểm AI, trạng thái
- Click vào bài → xem bài + kết quả AI + form thêm nhận xét thủ công

### 4.3 STUDENT — Thi thử VSTEP

**Trang chọn đề** (`/student/mock-tests`):
- Danh sách đề thi: tên, cấp độ, số câu, thời gian
- Nút "Bắt đầu thi"

**Trang thi** (`/student/mock-tests/:testId/take`):
- Timer đếm ngược góc phải
- Hiển thị từng câu hỏi (hoặc scroll toàn bộ — tùy thiết kế)
- Chọn đáp án A/B/C/D
- Auto-save nháp mỗi 30 giây (gọi API lưu answers)
- Nút Nộp bài → xác nhận → submit

**Trang kết quả thi:**
- Điểm tổng, số câu đúng/sai
- Bảng từng câu: đáp án học sinh chọn vs đáp án đúng
- Nút "Xem lại các lần thi trước"

### 4.4 OWNER — Quản lý bộ đề thi

**Trang đề thi** (`/owner/mock-tests`):
- Danh sách đề thi của trung tâm
- Tạo đề mới: nhập tên, cấp độ, thời gian
- Thêm câu hỏi: nhập đề, 4 đáp án, đánh dấu đáp án đúng
- Có thể import bulk câu hỏi (CSV hoặc JSON) — nếu backend hỗ trợ

### Checklist Phase 4

- [ ] Student nộp essay, thấy trạng thái "đang chấm"
- [ ] Student xem kết quả AI đầy đủ (điểm + nhận xét từng tiêu chí)
- [ ] Teacher xem và thêm nhận xét thủ công
- [ ] Student chọn đề và thi thử
- [ ] Timer hoạt động, auto-save nháp
- [ ] Student xem kết quả thi ngay sau khi nộp
- [ ] Student xem lịch sử các lần thi

---

## Phase 5 — UI Polish ★ Làm đẹp

**Bắt đầu:** Sau khi toàn bộ hệ thống hoạt động đúng end-to-end
**Kết thúc khi:** Giao diện đủ đẹp để demo cho trung tâm tiếng Anh thật

Đây là phase duy nhất tập trung vào trải nghiệm thị giác.
Không thêm tính năng mới ở phase này. Chỉ cải thiện giao diện và UX.

### 5.1 Design System cơ bản

Định nghĩa một lần, dùng xuyên suốt:

**Màu sắc:**
- Primary: màu chính của thương hiệu Owlexa
- Surface: nền trang, nền card
- Text: primary, secondary, disabled
- Status: success (đóng rồi), warning (sắp hạn), danger (quá hạn)

**Typography:**
- Heading: font chữ rõ, dễ đọc
- Body: cỡ chữ 14–16px
- Caption: 12px cho label, badge

**Spacing system:** 4px base unit — 4, 8, 12, 16, 24, 32, 48, 64

**Border radius:** thống nhất 1 mức (ví dụ: 8px cho card, 4px cho button)

### 5.2 Component Library — refactor lại các component UI

Ưu tiên refactor theo thứ tự: component nào dùng nhiều nhất làm trước.

**Button:** có variant (primary/secondary/ghost/danger), có loading state
**Input/Textarea:** label, placeholder, error message đồng nhất
**Table:** responsive, row hover, sort column
**Badge/Tag:** trạng thái học phí (PAID/UNPAID/PARTIAL)
**Modal:** confirm action nguy hiểm (xóa, logout all)
**Toast notification:** thành công / lỗi sau mỗi action
**Empty state:** khi bảng không có dữ liệu

### 5.3 Cải thiện UX theo từng role

**OWNER Dashboard:**
- Chart doanh thu theo tháng (dùng Recharts — nhẹ, đủ dùng)
- Bảng học phí có highlight màu theo trạng thái

**TEACHER Điểm danh:**
- Giao diện nhanh hơn: click 1 lần để toggle trạng thái
- Hiển thị tỉ lệ chuyên cần ngay trên màn hình

**STUDENT Portal:**
- Thẻ lịch học trực quan hơn
- Hiển thị số tiền nợ nổi bật

**Essay Result:**
- Điểm từng tiêu chí dạng visual rõ ràng
- Nhận xét AI được format đẹp (xuống dòng, highlight từ khóa)

### 5.4 Responsive

Ưu tiên: Tablet (học sinh dùng iPad) > Desktop > Mobile

Các màn hình bắt buộc responsive:
- Trang lịch học (quan trọng nhất — học sinh xem hàng ngày)
- Trang đóng học phí (học sinh dùng điện thoại)
- Trang điểm danh (giáo viên dùng tablet)

### 5.5 Loading & Error States

Mọi API call phải có:
- **Loading state:** skeleton hoặc spinner
- **Error state:** thông báo lỗi + nút thử lại
- **Empty state:** nội dung hướng dẫn khi chưa có dữ liệu

### Checklist Phase 5

- [ ] Design system: màu, font, spacing được định nghĩa
- [ ] Tất cả Button có loading state
- [ ] Table responsive trên tablet
- [ ] Toast notification sau mỗi action thành công/thất bại
- [ ] Empty state có nội dung hướng dẫn
- [ ] Dashboard OWNER có ít nhất 1 chart
- [ ] Trang lịch học responsive trên mobile
- [ ] Trang đóng học phí dùng được trên điện thoại

---

## Phụ lục: Mapping Frontend ↔ Backend API

### Auth APIs

| Frontend Action | Method | Endpoint |
|-----------------|--------|----------|
| Đăng nhập | POST | `/auth/login` |
| Đăng ký OWNER | POST | `/auth/register/owner` |
| Đăng ký STUDENT | POST | `/auth/register/student` |
| Refresh token | POST | `/auth/refresh-token` |
| Đăng xuất | POST | `/auth/logout` |
| Đăng xuất tất cả thiết bị | DELETE | `/auth/sessions` |

### Teacher APIs (gọi bởi OWNER)

| Frontend Action | Method | Endpoint |
|-----------------|--------|----------|
| Danh sách giáo viên | GET | `/centers/{id}/teachers` |
| Thêm 1 giáo viên | POST | `/centers/{id}/teachers` |
| Thêm hàng loạt | POST | `/centers/{id}/teachers/bulk` |
| Cập nhật giáo viên | PUT | `/centers/{id}/teachers/{teacherId}` |
| Xóa giáo viên | DELETE | `/centers/{id}/teachers/{teacherId}` |

### Student APIs

| Frontend Action | Method | Endpoint |
|-----------------|--------|----------|
| Danh sách học sinh | GET | `/centers/{id}/students` |
| Thêm hàng loạt | POST | `/centers/{id}/students/bulk` |
| Hồ sơ học sinh | GET | `/centers/{id}/students/{studentId}` |

### Class APIs

| Frontend Action | Method | Endpoint |
|-----------------|--------|----------|
| Danh sách lớp | GET | `/centers/{id}/classes` |
| Tạo lớp | POST | `/centers/{id}/classes` |
| Chi tiết lớp | GET | `/classes/{classId}` |
| Học sinh của lớp | GET | `/classes/{classId}/enrollments` |

### Fee & Payment APIs

| Frontend Action | Method | Endpoint |
|-----------------|--------|----------|
| Danh sách hóa đơn | GET | `/centers/{id}/fee-records` |
| Hóa đơn của 1 học sinh | GET | `/students/{id}/fee-records` |
| Thu học phí tiền mặt | POST | `/payments` |
| Lịch sử thanh toán | GET | `/centers/{id}/payments` |

### Essay APIs

| Frontend Action | Method | Endpoint |
|-----------------|--------|----------|
| Danh sách rubric | GET | `/classes/{id}/essay-criteria` |
| Tạo rubric | POST | `/classes/{id}/essay-criteria` |
| Nộp essay | POST | `/essays/submit` |
| Xem kết quả essay | GET | `/essays/{id}` |
| Danh sách essay của lớp (teacher) | GET | `/classes/{id}/essays` |

### Mock Test APIs

| Frontend Action | Method | Endpoint |
|-----------------|--------|----------|
| Danh sách đề thi | GET | `/centers/{id}/mock-tests` |
| Bắt đầu thi | POST | `/mock-tests/{id}/start` |
| Lưu nháp | PUT | `/test-results/{id}/answers` |
| Nộp bài | POST | `/test-results/{id}/submit` |
| Kết quả thi | GET | `/test-results/{id}` |
| Lịch sử thi | GET | `/students/{id}/test-results` |

---

## Phụ lục: Những điều KHÔNG làm ở Frontend

Đây là danh sách các việc thuộc về backend, không được implement ở frontend:

- **Không tự tính học phí** — chỉ hiển thị số backend trả về
- **Không tự check role trong business logic** — chỉ dùng role để ẩn/hiện UI
- **Không lưu refresh token** — để HttpOnly Cookie backend quản lý
- **Không validate phức tạp** — chỉ validate "không để trống", format email/phone
- **Không xử lý Sepay webhook** — backend làm, frontend chỉ polling kết quả
- **Không tự tạo userId hay centerId** — luôn lấy từ token hoặc response

---

*Owlexa Frontend Roadmap — Cập nhật theo tiến độ backend · 2025–2026*