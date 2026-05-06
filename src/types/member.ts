type MemberType = {
  id: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
};

export default MemberType;