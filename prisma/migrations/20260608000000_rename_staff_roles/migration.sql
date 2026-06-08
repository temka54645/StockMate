-- Ажилтны үүргийн нэрийг шинэчлэх
-- manager → director (Захирал)
-- staff   → manager  (Менежер)
-- viewer  → staff    (Ажилтан)
UPDATE "StaffMember" SET role = 'director' WHERE role = 'manager';
UPDATE "StaffMember" SET role = 'manager'  WHERE role = 'staff';
UPDATE "StaffMember" SET role = 'staff'    WHERE role = 'viewer';
