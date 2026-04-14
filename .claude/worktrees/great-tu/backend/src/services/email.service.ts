
export const emailService = {
    sendReceipt: async (to: string, receiptUrl: string) => {
        console.log(`[EmailService] 📧 Sending receipt to ${to}`);
        console.log(`[EmailService] 🔗 Receipt URL: ${receiptUrl}`);
        // In a real application, integration with SendGrid, AWS SES, or similar would go here.
        return Promise.resolve();
    }
};
