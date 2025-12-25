import QueryString from "qs";
import AppError from "../../helper/AppError";
import axios from "axios";

export const sslPaymentInit = async (payload: any) => {
    try {
        const data = {
            store_id: process.env.SSL_STORE_ID,
            store_passwd: process.env.SSL_STORE_PASSWORD,
            total_amount: payload.amount.toFixed(2), // Fixed to 2 decimal places
            currency: "BDT",
            tran_id: payload.transactionId,
            success_url: `${process.env.SSL_SUCCESS_BACKEND_URL}?transactionId=${payload.transactionId}&bookingId=${payload.bookingId}`,
            fail_url: `${process.env.SSL_FAIL_BACKEND_URL}?transactionId=${payload.transactionId}&bookingId=${payload.bookingId}`,
            cancel_url: `${process.env.SSL_CANCEL_BACKEND_URL}?transactionId=${payload.transactionId}&bookingId=${payload.bookingId}`,
            // ipn_url: `${envVars.API_BASE_URL}/api/v1/payment/ipn`, // Add IPN URL
            shipping_method: "N/A",
            product_name: "Tour Booking",
            product_category: "Tourism Service",
            product_profile: "non-physical-goods",
            cus_name: payload.name,
            cus_email: payload.email,
            cus_add1: payload.address,
            cus_add2: "N/A",
            cus_city: "Bogra",
            cus_state: "Rajshahi",
            cus_postcode: "5840",
            cus_country: "Bangladesh", // Fixed typo
            cus_phone: payload.phone,
            cus_fax: "N/A",
            ship_name: "N/A",
            ship_add1: "N/A",
            ship_add2: "N/A",
            ship_city: "N/A",
            ship_state: "N/A",
            ship_postcode: "1000",
            ship_country: "Bangladesh",
            multi_card_name: "", // Optional
            value_a: payload.bookingId, // Custom field to pass booking ID
            value_b: payload.transactionId,
            value_c: payload.email,
            value_d: payload.name,
        };

        const response = await axios({
            method: "POST",
            url: process.env.SSL_PAYMENT_URL,
            data: QueryString.stringify(data), 
            headers: {
                'Content-Type': "application/x-www-form-urlencoded"
            }
        });

        if (response.data.status !== 'SUCCESS') {
            throw new Error(`SSLCommerz Error: ${response.data.failedreason}`);
        }

        return response.data;
    } catch (error: any) {
        console.error("SSL Payment Error:", error.response?.data || error.message);
        throw new AppError(500, "Failed to initialize payment: " + error.message);
    }
}