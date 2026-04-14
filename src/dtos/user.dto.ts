import { ROLES } from "../config/constants";

export interface UserResponseDTO {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  roleId: string;
  roleName?: string | null;
  isAdmin?: boolean;
  isDeveloper?: boolean;
  isUser?: boolean;
}

// A simple mapper function to transform the Model into the DTO
export const mapToUserDTO = (user: any): UserResponseDTO => {
  const u = user.get ? user.get({ plain: true }) : user;
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    avatarUrl: u.avatarUrl || null,
    roleId: u.roleId,
    roleName: (u.Role && u.Role.name) || u.roleName || null,
    isAdmin:
      (u.roleName && String(u.roleName).toLowerCase() === "admin") ||
      u.roleId === ROLES.ADMIN,
    isDeveloper:
      (u.roleName && String(u.roleName).toLowerCase() === "developer") ||
      u.roleId === ROLES.DEVELOPER,
    isUser:
      (u.roleName && ["user", "buyer"].includes(String(u.roleName).toLowerCase())) ||
      u.roleId === ROLES.USER,
  };
};
