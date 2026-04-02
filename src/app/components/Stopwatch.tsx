"use client";
import { useEffect, useState } from "react";

type Props = {
  createdAt: string;
};

export default function Stopwatch({ createdAt }: Props) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const created = new Date(createdAt);
      const diff = now.getTime() - created.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setElapsed(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <p className="text-xs text-gray-500">
      <span className="font-semibold">Time since created:</span> {elapsed}
    </p>
  );
}
