import OrganizationType from "./organization";

type MembershipType = {
  role: string;
  organization: OrganizationType;
};

export default MembershipType;