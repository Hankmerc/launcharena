
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function TestDatabasePage() {
  const [message, setMessage] = useState("Проверяем подключение...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase
        .from("products")
        .select("id")
        .limit(1);

      if (error) {
        setMessage("Ошибка: " + error.message);
      } else {
        setMessage("Успех! LaunchArena подключён к Supabase.");
      }
    }

    testConnection();
  }, []);

  return (
    <main className="min-h-screen bg-[#0B0A12] p-10 text-white">
      <h1 className="mb-4 text-3xl font-bold">
        Проверка базы данных
      </h1>
      <p>{message}</p>
    </main>
  );
}
