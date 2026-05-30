import { ChatExperience } from '../components/chat';

export const Chat = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top,_rgba(201,169,110,0.25),_transparent_55%)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div />
          <div className="rounded-full border border-[#e8d5a8] bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.25em] text-[#6b5438]">
            Tư vấn cao cấp
          </div>
        </div>
        <ChatExperience />
      </div>
    </div>
  );
};
