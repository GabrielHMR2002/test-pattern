import { Carrinho } from '../domain/Carrinho.js';
import { Item } from '../domain/Item.js';
import { UserMother } from './UserMother.js';

/**
 * Data Builder Pattern para criação flexível de Carrinhos
 * Resolve o problema de "explosão de métodos" do Object Mother
 * e torna o setup dos testes mais legível e explícito
 */
export class CarrinhoBuilder {
    
    constructor() {
        // Valores padrão - um carrinho básico com 1 item
        this._user = UserMother.umUsuarioPadrao();
        this._itens = [new Item('Produto Padrão', 100)];
    }

    /**
     * Método fluente para definir o usuário do carrinho
     */
    comUser(user) {
        this._user = user;
        return this; // Retorna 'this' para permitir encadeamento
    }

    /**
     * Método fluente para definir os itens do carrinho
     */
    comItens(itens) {
        this._itens = itens;
        return this;
    }

    /**
     * Método fluente para adicionar um único item
     */
    comItem(nome, preco) {
        this._itens.push(new Item(nome, preco));
        return this;
    }

    /**
     * Método fluente para criar um carrinho vazio
     */
    vazio() {
        this._itens = [];
        return this;
    }

    /**
     * Método fluente para criar um carrinho com valor específico
     */
    comValorTotal(valor) {
        this._itens = [new Item('Item Customizado', valor)];
        return this;
    }

    /**
     * Método que constrói e retorna a instância final do Carrinho
     */
    build() {
        return new Carrinho(this._user, this._itens);
    }
}