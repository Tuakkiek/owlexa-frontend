import fs from 'fs';

const filePath = "c:/Users/ADMIN/Owlexa/owlexa-frontend/src/pages/student/StudentSubmissionAttemptPage.tsx";
let content = fs.readFileSync(filePath, "utf-8");

const countdownComponent = `
const CountdownTimer = ({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      return Math.max(0, Math.floor(diff / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left === 0) {
        clearInterval(timer);
        onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const isUrgent = timeLeft > 0 && timeLeft <= 300; // 5 minutes

  if (timeLeft === 0) return <span className="text-red-600 font-bold">Hết giờ</span>;

  return (
    <span className={\`font-mono font-medium flex items-center gap-1.5 px-2 py-1 rounded border \${isUrgent ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200'}\`}>
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {hours > 0 && \`\${hours.toString().padStart(2, "0")}:\`}
      {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
    </span>
  );
};

export const StudentSubmissionAttemptPage = () => {
`;

content = content.replace("export const StudentSubmissionAttemptPage = () => {", countdownComponent);

const headerTarget = `              {attempt && (
                <span
                  className="text-xs text-gray-500"
                  role="status"
                  aria-live="polite"
                >
                  {isEditable
                    ? isSaving`;

const headerReplacement = `              {attempt?.expiresAt && isEditable && (
                <CountdownTimer 
                  expiresAt={attempt.expiresAt} 
                  onExpire={() => {
                    toast.error("Đã hết thời gian làm bài, hệ thống đang nộp bài tự động...");
                    submitAttempt();
                  }} 
                />
              )}
              {attempt && (
                <span
                  className="text-xs text-gray-500"
                  role="status"
                  aria-live="polite"
                >
                  {isEditable
                    ? isSaving`;

content = content.replace(headerTarget, headerReplacement);

fs.writeFileSync(filePath, content, "utf-8");
console.log("Updated StudentSubmissionAttemptPage.tsx");
