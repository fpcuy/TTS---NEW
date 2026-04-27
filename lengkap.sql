BEGIN
    RETURN QUERY
    SELECT 
        shipments."Tracking No"::TEXT, 
        shipments."Tracking No link"::TEXT, 
        shipments."Customer Reference No"::TEXT, 
        shipments."Customer Reference No link"::TEXT, 
        shipments."Create Time"::TIMESTAMP, 
        shipments."Tracking Status"::TEXT, 
        shipments."Account ID"::BIGINT, 
        shipments."Original pickup option"::TEXT, 
        shipments."Actual pickup option"::TEXT, 
        shipments."Scheduled Pickup Time"::TIMESTAMP, 
        shipments."Actual Pickup/Drop Off Time"::TIMESTAMP, 
        shipments."Delivered Time"::TIMESTAMP, 
        shipments."Delivery OnHold Times"::TEXT, 
        shipments."Delivery OnHold Reason"::TEXT, 
        shipments."Returning Start Time"::TIMESTAMP, 
        shipments."Recipient Name"::TEXT, 
        shipments."Recipient Phone Number"::TEXT, 
        shipments."Recipient Province"::TEXT, 
        shipments."Recipient City"::TEXT, 
        shipments."Recipient District"::TEXT, 
        shipments."Recipient Detail Address"::TEXT, 
        shipments."Recipient Postal Code"::TEXT, 
        shipments."Sender Name"::TEXT, 
        shipments."Sender Phone Number"::TEXT, 
        shipments."Sender Province"::TEXT, 
        shipments."Sender City"::TEXT, 
        shipments."Sender District"::TEXT, 
        shipments."Sender Detail Address"::TEXT, 
        shipments."Sender Postal Code"::TEXT, 
        shipments."Payment Role"::TEXT, 
        shipments."Item in Parcel"::TEXT, 
        shipments."No of item in Parcel"::INTEGER, 
        shipments."COD Collection(Y/N)"::TEXT, 
        shipments."COD Amount"::NUMERIC, 
        shipments."Parcel Value"::NUMERIC, 
        shipments."Parcel Weight"::NUMERIC, 
        shipments."Actual Weight"::NUMERIC, 
        shipments."Estimated Shipping Fee"::NUMERIC, 
        shipments."Actual Shipping Fee"::NUMERIC, 
        shipments."Basic Shipping Fee"::NUMERIC, 
        shipments."Insurance Fee"::NUMERIC, 
        shipments."COD Service Fee"::NUMERIC, 
        shipments."Return Shipping Fee"::NUMERIC, 
        shipments."Delivery failed Reason"::TEXT, 
        shipments."Create Method"::TEXT, 
        shipments."Order Creator"::TEXT, 
        shipments."ID Product"::TEXT,
        
        products."Variant Name"::TEXT, 
        products."Product Name"::TEXT, 
        products."HPP"::NUMERIC, -- Pastikan di RETURNS TABLE kolom ke-51 adalah NUMERIC

        "customer service"."Real Name"::TEXT,
        "customer service"."Agent Name"::TEXT,
        "customer service"."Phone Number"::TEXT,
        
        2500::INTEGER AS "Gudang",
        (CASE WHEN shipments."Tracking Status" = 'Delivered' THEN products."HPP" ELSE 0 END)::NUMERIC AS "_HPP",
        (CASE WHEN shipments."Tracking Status" = 'Delivered' THEN COALESCE(shipments."COD Amount", 0) ELSE 0 END)::NUMERIC AS "_COD",
        COALESCE(shipments."No of item in Parcel", 0)::INTEGER AS "Qty",
        ((CASE WHEN shipments."Tracking Status" = 'Delivered' THEN products."HPP" ELSE 0 END) * COALESCE(shipments."No of item in Parcel", 0))::NUMERIC AS "HPP_Total",
        (CASE WHEN shipments."Tracking Status" = 'Delivered' THEN COALESCE(shipments."Actual Shipping Fee", 0) ELSE 0 END)::NUMERIC AS "Ongkir",
        (CASE WHEN shipments."Tracking Status" = 'Delivered' THEN COALESCE(shipments."Actual Shipping Fee" * 0.005, 0) ELSE 0 END)::NUMERIC AS "PPN",
        (CASE WHEN shipments."Tracking Status" = 'Delivered' THEN 5000 ELSE 0 END)::INTEGER AS "Komisi CS",
        (CASE 
            WHEN shipments."Tracking Status" = 'Delivered' THEN
                COALESCE(shipments."COD Amount", 0) 
                - (products."HPP" * COALESCE(shipments."No of item in Parcel", 0)) 
                - COALESCE(shipments."Actual Shipping Fee", 0) 
                - (COALESCE(shipments."Actual Shipping Fee", 0) * 0.005) 
                - 5000 
                - 2500 
            ELSE - 2500
        END)::NUMERIC AS "Uang_Masuk"
    FROM shipments
    JOIN products ON shipments."ID Product" = products."ID Product"::TEXT
    LEFT JOIN "customer service" ON "customer service"."ID Customer Service"::TEXT = 
        SUBSTRING(shipments."Item in Parcel" FROM '.*\((.*)\).*');
END;
$$ LANGUAGE plpgsql;