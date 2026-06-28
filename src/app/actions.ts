"use server";

import { sendConfirmationEmail } from "@/lib/emails";

export async function processBookingAction({
  email,
  name,
  date,
  time,
  service
}: {
  email: string;
  name: string;
  date: string;
  time: string;
  service: string;
}) {
  return await sendConfirmationEmail({ email, name, date, time, service });
}
