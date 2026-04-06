export interface UserResponseDTO {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  roleId: string;
}

// A simple mapper function to transform the Model into the DTO
export const mapToUserDTO = (user: any): UserResponseDTO => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    roleId: user.roleId,
  };
};
