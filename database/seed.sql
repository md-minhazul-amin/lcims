-- LCIMS seed data (run after schema.sql)

INSERT INTO categories (name) VALUES
    ('Coffee Beans'),
    ('Milk & Dairy'),
    ('Syrups'),
    ('Pastries'),
    ('Packaging')
ON CONFLICT (name) DO NOTHING;

INSERT INTO inventory_items (name, category_id, quantity, unit, reorder_level, unit_price, supplier) VALUES
    ('Arabica Beans 1kg',     1, 25, 'kg',   10, 32.00, 'BeanCo'),
    ('Full Cream Milk 2L',    2, 40, 'L',    20,  4.50, 'DairyFresh'),
    ('Vanilla Syrup 750ml',   3, 12, 'btl',   5, 14.00, 'SyrupHouse'),
    ('Croissant',             4, 30, 'unit', 15,  3.20, 'BakeryWorks'),
    ('12oz Takeaway Cup',     5, 500,'unit',200,  0.18, 'PackPlus')
ON CONFLICT DO NOTHING;
