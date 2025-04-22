
export const WelcomeMessage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="mb-6 text-5xl">👋</div>
      <h2 className="text-2xl font-bold mb-2">Welcome to Chatwii</h2>
      <p className="text-muted-foreground max-w-md">
        Select a user from the list to start chatting
      </p>
    </div>
  );
};
