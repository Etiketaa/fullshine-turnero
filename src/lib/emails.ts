import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail({
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
  try {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5492915275183';

    const { data, error } = await resend.emails.send({
      from: 'Fullshine Detailing <onboarding@resend.dev>',
      to: [email],
      subject: '¡Turno Confirmado! - Fullshine Car Detailing',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #fff; padding: 40px; border-radius: 20px;">
          <h1 style="color: #dc2626; font-size: 32px; letter-spacing: -1px; margin-bottom: 20px;">FULLSHINE</h1>
          <p style="font-size: 18px; line-height: 1.6; color: #ccc;">Hola <strong>${name}</strong>,</p>
          <p style="font-size: 18px; line-height: 1.6; color: #ccc;">Tu turno ha sido confirmado con éxito. ¡Tu auto va a brillar!</p>
          
          <div style="background-color: #111; padding: 25px; border-radius: 15px; margin: 30px 0; border: 1px solid #222;">
            <h2 style="margin-top: 0; color: #dc2626; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Detalles de la cita</h2>
            <p style="margin: 10px 0; font-size: 16px;"><strong>Servicio:</strong> ${service}</p>
            <p style="margin: 10px 0; font-size: 16px;"><strong>Fecha:</strong> ${date}</p>
            <p style="margin: 10px 0; font-size: 16px;"><strong>Horario:</strong> ${time} hs</p>
          </div>

          <div style="text-align: center; margin: 35px 0;">
            <a href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`¡Hola! Soy *${name}*. Quisiera confirmar mi turno de ${service} el día ${date} a las ${time} hs.`)}" 
               style="background-color: #25D366; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">
              Enviar Confirmación por WhatsApp
            </a>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 40px;">
            Si necesitas cancelar o reprogramar, por favor avisanos con al menos 24 horas de anticipación por WhatsApp.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #222; text-align: center;">
            <p style="font-size: 12px; color: #444;">&copy; 2024 FULLSHINE CAR DETAILING. Todos los derechos reservados.</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Server error sending email:', error);
    return { success: false, error };
  }
}
