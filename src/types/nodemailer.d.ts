declare module "nodemailer" {
  const nodemailer: {
    createTransport(config: unknown): {
      sendMail(message: {
        from: string;
        to: string;
        subject: string;
        text: string;
        html: string;
      }): Promise<unknown>;
    };
  };

  export default nodemailer;
}
