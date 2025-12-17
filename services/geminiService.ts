import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeSalesData = async (transactions: Transaction[], question: string): Promise<string> => {
  try {
    // Format data as a CSV-like string to save tokens but keep structure
    const dataString = transactions.slice(0, 50).map(t => 
      `${t.date.split('T')[0]}, ${t.productName}, ${t.category}, Qty:${t.quantity}, Rp${t.total}`
    ).join('\n');

    const prompt = `
      Anda adalah asisten analisis bisnis cerdas untuk aplikasi penjualan "TokoSheet".
      Berikut adalah data penjualan mentah (maksimal 50 transaksi terakhir):
      
      ---AWAL DATA---
      ${dataString}
      ---AKHIR DATA---

      Pengguna bertanya: "${question}"

      Tugas anda:
      1. Jawab pertanyaan pengguna berdasarkan data di atas.
      2. Gunakan Bahasa Indonesia yang profesional namun ramah.
      3. Jika data kosong, beritahu pengguna.
      4. Berikan insight singkat jika relevan (misal: tren penjualan).
      
      Jawab dengan format markdown ringkas.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Maaf, saya tidak dapat menganalisis data saat ini.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Terjadi kesalahan saat menghubungi layanan AI. Pastikan API Key valid.";
  }
};