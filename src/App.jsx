import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";

export default function TaskTimerApp() {
  const [tasks, setTasks] = useState([
    { name: "段取り", time: 10 },
    { name: "組立", time: 600 },
    { name: "検査", time: 420 },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState(tasks[0].time);
  const [running, setRunning] = useState(false);

  const alarmPlayedRef = useRef(false);

  useEffect(() => {
    let timer;
    if (running) {
      timer = setInterval(() => {
        setRemaining((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [running]);

  // ✅ 0になった瞬間にアラーム
  useEffect(() => {
    if (remaining <= 0 && !alarmPlayedRef.current) {
      playAlarm();
      alarmPlayedRef.current = true;
    }
  }, [remaining]);

  const playAlarm = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1000, ctx.currentTime);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
    oscillator.stop(ctx.currentTime + 1);
  };

  const handleStart = () => {
    alarmPlayedRef.current = false;
    setRunning(true);
  };

  const handleStop = () => setRunning(false);

  // ✅ プルダウン選択
  const handleSelectTask = (e) => {
    const index = Number(e.target.value);
    setCurrentIndex(index);
    setRemaining(tasks[index].time);
    alarmPlayedRef.current = false;
  };

  // ✅ 個別ログ保存（シンプル版）
  const saveLog = () => {
    const task = tasks[currentIndex];
    const delay = -remaining;
    const now = new Date();
    const timestamp = now.toISOString();

    const csv = `時間,作業名,標準時間(秒),遅れ(秒)
${timestamp},${task.name},${task.time},${delay > 0 ? delay : 0}`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `log_${task.name}_${Date.now()}.csv`;
    link.click();
  };

  const handleNext = () => {
    saveLog();

    // ✅ 最後まで行ったら最初に戻る
    const nextIndex = (currentIndex + 1) % tasks.length;

    setCurrentIndex(nextIndex);
    setRemaining(tasks[nextIndex].time);
    alarmPlayedRef.current = false;
  };

  const formatTime = (sec) => {
    const abs = Math.abs(sec);
    const m = Math.floor(abs / 60);
    const s = abs % 60;
    const sign = sec < 0 ? "-" : "";
    return `${sign}${m}:${s.toString().padStart(2, "0")}`;
  };

  const isOver = remaining < 0;

  return (
    <div className="p-6 grid gap-4 max-w-md mx-auto">
      <Card className="rounded-2xl shadow">
        <CardContent className="p-4">
          <h2 className="text-xl font-bold">現在の作業</h2>

          <select
            value={currentIndex}
            onChange={handleSelectTask}
            className="mt-2 p-2 border rounded w-full"
          >
            {tasks.map((task, idx) => (
              <option key={idx} value={idx}>
                {task.name}
              </option>
            ))}
          </select>

          <p className={`text-4xl mt-4 font-mono font-bold ${isOver ? "text-red-500" : ""}`}>
            {formatTime(remaining)}
          </p>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleStart}>開始</Button>
            <Button onClick={handleStop}>停止</Button>
            <Button onClick={handleNext}>次へ</Button>
          </div>

          {isOver && (
            <p className="text-red-500 mt-2">
              → {Math.abs(remaining)}秒 遅れ
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow">
        <CardContent className="p-4">
          <h2 className="text-lg font-bold">タスク一覧</h2>
          <ul className="mt-2">
            {tasks.map((task, idx) => (
              <li key={idx} className="text-sm">
                {task.name} - {formatTime(task.time)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
