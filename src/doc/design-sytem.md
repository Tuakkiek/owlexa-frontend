# Owlexa Design System

Version: 1.0

---

# 1. Design Philosophy

Owlexa sử dụng phong cách:

- Minimal
- Enterprise
- Professional
- Clean
- Spacious

Tham khảo:

- DeepSeek Platform
- Linear
- Stripe Dashboard
- GitHub
- Notion

Không sử dụng:

- Gradient
- Glass
- Neumorphism
- Shadow lớn
- Màu sắc quá nhiều

---

# 2. Color System

Primary

Orange

Secondary

Gray

Background

#F9FAFB

Surface

White

Border

Gray-200

Divider

Gray-100

Text Primary

Gray-900

Text Secondary

Gray-500

Danger

Red

Warning

Amber

Success

Emerald

Info

Blue

Không sử dụng màu khác.

---

# 3. Border Radius

Tất cả component phải thống nhất.

Input

12px

Button

12px

Card

16px

Modal

16px

Drawer

16px

Dropdown

12px

Badge

9999px

Không tự ý dùng:

rounded-lg

rounded-xl

rounded-2xl

linh tinh.

---

# 4. Shadow

Hạn chế dùng shadow.

Card:

shadow-sm

Hover:

shadow-md

Không dùng shadow lớn.

---

# 5. Border

Border luôn:

1px

gray-200

Không dùng border đen.

---

# 6. Page Layout

Mỗi page luôn có:

PageContainer

↓

PageHeader

↓

Toolbar (nếu có)

↓

Content

Không tự ý tạo layout khác.

---

# 7. Page Header

Bao gồm:

Title

Subtitle (nếu cần)

Action Buttons bên phải

Không tạo nhiều style header.

---

# 8. Typography

Font:

Inter

Title Page

32

Section

24

Card Title

18

Body

14~16

Caption

12

Không dùng quá nhiều cỡ chữ.

---

# 9. Spacing

Sử dụng scale:

4

8

12

16

24

32

40

48

Không dùng số lẻ.

Ví dụ:

padding:17px

margin:23px

=> Không được.

---

# 10. Card

Card luôn:

White

Border

Radius 16

Padding 24

Không background màu.

---

# 11. Button

Primary

Orange

Secondary

White

Danger

Red

Ghost

Transparent

Outline

Border Gray

Toàn bộ button dùng chung component.

---

# 12. Input

Height thống nhất.

Border Gray

Focus Orange

Radius 12

Không style riêng từng page.

---

# 13. Table

Header nền trắng.

Border dưới.

Hover nhẹ.

Padding đồng nhất.

Không zebra.

---

# 14. Modal

Radius 16

Padding 24

Header

Body

Footer

Chuẩn hóa.

---

# 15. Empty State

Có:

Icon

Title

Description

Action

Không để màn hình trắng.

---

# 16. Icons

Lucide React.

Size:

16

18

20

24

Không dùng nhiều kích cỡ.

---

# 17. Animation

Transition:

150~200ms

ease

Không animation phức tạp.

---

# 18. Responsive

Desktop ưu tiên.

Tablet.

Mobile.

Không làm vỡ layout.

---

# 19. Component Priority

Luôn ưu tiên:

Shared Component

↓

Base Component

↓

Business Component

↓

Page

Không code UI trực tiếp trong page nếu có thể tách.

---

# 20. Checklist

Trước khi commit luôn kiểm tra:

☐ Typography

☐ Radius

☐ Border

☐ Shadow

☐ Spacing

☐ Color

☐ Button

☐ Input

☐ Table

☐ Modal

☐ Card

☐ Empty State

☐ Responsive

☐ Accessibility

Nếu có bất kỳ mục nào chưa đúng thì phải sửa trước khi merge.