-- AddForeignKey
ALTER TABLE "SSLCommerzTransaction" ADD CONSTRAINT "SSLCommerzTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
