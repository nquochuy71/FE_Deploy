# QUY TẮC SINH SKU CHO BIẾN THỂ SẢN PHẨM MỸ PHẨM

## 1. Nguyên tắc bắt buộc (AI phải tuân thủ khi tạo SKU)

- Mỗi biến thể sản phẩm có một SKU **duy nhất, không trùng lặp**.
- SKU chỉ chứa ký tự: **A-Z (in hoa)**, **0-9**, dấu **gạch ngang (-)**. Không dấu, không khoảng trắng, không ký tự đặc biệt khác.
- Độ dài SKU: **từ 10 đến 25 ký tự** (khuyến nghị 15–20).
- Cấu trúc SKU cố định theo thứ tự các nhóm, phân cách bằng dấu gạch ngang.
- SKU không thay đổi sau khi tạo, kể cả sản phẩm ngừng bán.

## 2. Cấu trúc SKU chuẩn
[BRAND_CODE] - [LINE_CODE] - [TYPE_CODE] - [VARIANT_CODE] - [SIZE_CODE]

**Trong đó:**
| Nhóm | Ý nghĩa | Độ dài | Bắt buộc? |
|------|---------|---------|-----------|
| BRAND_CODE | Mã thương hiệu | 2–4 chữ cái | Có |
| LINE_CODE | Mã dòng sản phẩm | 2–5 chữ cái/số | Có (nếu không có thì dùng `00`) |
| TYPE_CODE | Mã dạng bào chế / loại sản phẩm | 2–4 ký tự | Có |
| VARIANT_CODE | Mã biến thể (màu, da, mùi, công dụng...) | 2–6 ký tự | Có (nếu không có thì dùng `00`) |
| SIZE_CODE | Dung tích / trọng lượng | 3–5 ký tự (số+ML/G/T) | Có |

> Nếu sản phẩm không có thuộc tính nào đó, thay bằng `00` (không được bỏ trống).

## 3. Bảng mã chuẩn cho các thuộc tính mỹ phẩm

### 3.1. Mã thương hiệu (BRAND_CODE) – Ví dụ minh họa
| Thương hiệu | Mã |
|-------------|-----|
| La Roche-Posay | LR |
| Cerave | CL |
| L’Oréal | LO |
| Maybelline | MB |
| The Ordinary | TO |
| Nivea | NV |

### 3.2. Mã dòng sản phẩm (LINE_CODE) – Ví dụ
| Dòng | Mã |
|------|-----|
| Anthelios | AN |
| Effaclar | EF |
| SuperStay Matte Ink | SSM |
| Vitamin C | VC |

### 3.3. Mã dạng sản phẩm (TYPE_CODE) – Danh sách chuẩn
| Dạng | Mã |
|------|-----|
| Kem (Cream) | CR |
| Sữa dưỡng / Lotion | LT |
| Serum / Dịch lỏng | SL |
| Kem chống nắng dạng sữa | SN |
| Son môi | LP |
| Son lì | MAT |
| Son bóng | GLO |
| Mascara | MS |
| Phấn phủ | PW |
| Kem nền | FD |
| Sữa rửa mặt | CL |
| Toner | TN |

### 3.4. Mã biến thể (VARIANT_CODE) – dùng cho màu sắc, loại da, hương thơm

**Màu sắc:**
| Màu | Mã |
|------|-----|
| Đỏ | RD |
| Hồng | PK |
| Nude | NL |
| Nâu | BR |
| Be | BE |
| Cam | OR |
| Tím | PP |
| Vàng | YW |
| Xanh dương | BL |
| Đen | BK |

**Loại da / tình trạng da:**
| Loại da | Mã |
|----------|-----|
| Da khô | DRY |
| Da dầu | OIL |
| Da thường | NOR |
| Da hỗn hợp | COM |
| Da nhạy cảm | SEN |
| Da mụn | ACN |

**Mùi hương (nếu có):**
| Mùi | Mã |
|------|-----|
| Không mùi | UNS |
| Hoa hồng | ROS |
| Oải hương | LAV |
| Chanh | LEM |

### 3.5. Mã kích thước / dung tích (SIZE_CODE) – định dạng chuẩn
- Cú pháp: **Số + ĐƠN VỊ** (viết hoa, không cách)
- Đơn vị: `ML` (mililit), `G` (gram), `T` (viên), `P` (miếng)

**Ví dụ:** `30ML`, `50ML`, `100G`, `15G`, `500T`, `10P`

## 4. Quy tắc xử lý khi thiếu thuộc tính

| Trường hợp | Cách xử lý | Ví dụ |
|------------|-------------|--------|
| Không có dòng sản phẩm cụ thể | Dùng `00` | `LR-00-CR-OIL-50ML` |
| Không có biến thể (màu/da/mùi) | Dùng `00` | `MB-SSM-LP-00-5G` |
| Sản phẩm có 2 biến thể (vd: màu + size) | Ghép cả hai bằng dấu `-` trong phần VARIANT_CODE? **Không**. Phần VARIANT_CODE chỉ chứa **một nhóm thuộc tính chính** (ưu tiên: màu > loại da > mùi). Size đã có nhóm riêng. |
| Nếu cần thể hiện cả màu và loại da | Thêm vào VARIANT_CODE dạng `[MÀU][LOẠIDA]` (mỗi loại 2 ký tự) | `RDOIL` = màu đỏ + da dầu |

## 5. Logic sinh SKU bằng code (giả sử có hàm tạo)

**Input:** Các tham số:
- brand (string) → tra bảng lấy BRAND_CODE
- line (string hoặc null) → lấy LINE_CODE hoặc `00`
- type (string) → tra bảng lấy TYPE_CODE
- variant (object hoặc null) → chứa màu/da/mùi → tạo VARIANT_CODE
- size (string + unit) → chuẩn hóa thành SIZE_CODE

**Output:** SKU dạng `BRAND_CODE-LINE_CODE-TYPE_CODE-VARIANT_CODE-SIZE_CODE`, tất cả in hoa.

**Xử lý đặc biệt:**
- Nếu VARIANT_CODE dài hơn 6 ký tự → cắt lấy 6 ký tự đầu.
- Nếu SIZE_CODE không đúng định dạng (vd: `50ml` viết thường) → tự động chuẩn hóa thành `50ML`.
- Không dùng ký tự `_` hay `&` trong bất kỳ thành phần nào.

## 6. Ví dụ mẫu (dùng để kiểm tra logic)

| Sản phẩm | Input | Output SKU |
|----------|-------|-------------|
| Kem chống nắng La Roche-Posay Anthelios, da dầu, 50ml | brand=LR, line=AN, type=SN, variant=OIL, size=50ml | `LR-AN-SN-OIL-50ML` |
| Son lì Maybelline SuperStay màu Nude, 5g | brand=MB, line=SSM, type=MAT, variant=NL, size=5G | `MB-SSM-MAT-NL-5G` |
| Serum Vitamin C The Ordinary, không biến thể, 30ml | brand=TO, line=VC, type=SL, variant=null, size=30ML | `TO-VC-SL-00-30ML` |
| Kem dưỡng Cerave, không dòng, da khô, 100g | brand=CL, line=null, type=CR, variant=DRY, size=100G | `CL-00-CR-DRY-100G` |

## 7. Hướng dẫn cho AI khi nhận yêu cầu "sinh SKU"

Khi bạn (AI) được yêu cầu tạo SKU cho một biến thể sản phẩm mỹ phẩm, hãy thực hiện tuần tự:

1. Xác định đầy đủ các thành phần: thương hiệu, dòng, dạng, biến thể, size.
2. Tra cứu hoặc yêu cầu người dùng cung cấp mã cho từng thành phần nếu chưa có trong bảng.
3. Áp dụng cấu trúc `[BRAND]-[LINE]-[TYPE]-[VARIANT]-[SIZE]`.
4. Thay thế thành phần thiếu bằng `00`.
5. Chuyển toàn bộ sang chữ in hoa, loại bỏ dấu cách, kiểm tra không có ký tự đặc biệt.
6. Trả về SKU kèm giải thích ngắn.

**Ví dụ phản hồi của AI:**
Sku được tạo: LR-AN-SN-OIL-50ML
- Giải thích: LR=LaRochePosay, AN=Anthelios, SN=SunscreenLotion, OIL=da dầu, 50ML=dung tích 50ml.

## 8. Lưu ý khi code tích hợp (dành cho lập trình viên)

- Hãy tạo một module/dictionary lưu trữ các bảng mã (brand, line, type, variant, size) để dễ mở rộng.
- Sử dụng regex để kiểm tra tính hợp lệ của SKU: `^[A-Z0-9]{2,4}-[A-Z0-9]{2,5}-[A-Z0-9]{2,4}-[A-Z0-9]{2,6}-[0-9]{2,4}(ML|G|T|P)$`
- Có thể sinh SKU tự động từ form nhập liệu, hoặc qua API với các tham số đầu vào.

--- 