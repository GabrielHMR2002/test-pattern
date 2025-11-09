import { User } from '../domain/User.js';

/**
 * Object Mother Pattern para criação de usuários fixos
 * Útil para entidades simples que raramente mudam entre testes
 */
export class UserMother {
    
    static umUsuarioPadrao() {
        return new User(
            1,
            'João Silva',
            'joao@email.com',
            'PADRAO'
        );
    }

    static umUsuarioPremium() {
        return new User(
            2,
            'Maria Santos',
            'premium@email.com',
            'PREMIUM'
        );
    }

    static umUsuarioComEmail(email) {
        return new User(
            3,
            'Usuario Teste',
            email,
            'PADRAO'
        );
    }
}