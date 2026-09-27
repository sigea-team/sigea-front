import React, { useState } from 'react';
import RolePermissionsMatrix, { createDefaultPermissions } from './RolePermissionsMatrix';

export default {
  title: 'Features/Roles/RolePermissionsMatrix',
  component: RolePermissionsMatrix,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
  },
};

export const Default = {
  args: {
    permissions: createDefaultPermissions(false),
  },
};

export const FullAccess = {
  args: {
    permissions: createDefaultPermissions(true),
  },
};

export const Interactive = {
  render: () => {
    const [permissions, setPermissions] = useState({
      convocatorias: { read: true, write: true, edit: true, delete: false },
      eventos: { read: true, write: true, edit: false, delete: false },
      certificados: { read: true, write: false, edit: false, delete: false },
      usuarios: { read: false, write: false, edit: false, delete: false },
      reportes: { read: true, write: false, edit: false, delete: false },
    });

    return (
      <div className="p-4 bg-[#f7f7f8] rounded-[16px]">
        <RolePermissionsMatrix
          permissions={permissions}
          onChange={(newPerms) => setPermissions(newPerms)}
        />
      </div>
    );
  },
};
