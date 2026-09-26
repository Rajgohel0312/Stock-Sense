CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    role_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(255) NOT NULL,

    password_hash TEXT,

    avatar_url TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    email_verified_at TIMESTAMPTZ,

    last_login_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT
);