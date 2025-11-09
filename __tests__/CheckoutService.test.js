import { CheckoutService } from '../src/services/CheckoutService.js';
import { UserMother } from '../src/builders/UserMother.js';
import { CarrinhoBuilder } from '../src/builders/CarrinhoBuilder.js';
import { Item } from '../src/domain/Item.js';

describe('CheckoutService', () => {

    describe('quando o pagamento falha', () => {
        it('deve retornar null e não processar o pedido', async () => {
            // ARRANGE 
            const carrinho = new CarrinhoBuilder()
                .comValorTotal(150)
                .build();

            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ 
                    success: false, 
                    error: 'Cartão recusado' 
                })
            };

            const repositoryDummy = {
                salvar: jest.fn()
            };
            const emailDummy = {
                enviarEmail: jest.fn()
            };

            const checkoutService = new CheckoutService(
                gatewayStub,
                repositoryDummy,
                emailDummy
            );

            // ACT
            const pedido = await checkoutService.processarPedido(
                carrinho,
                '1234-5678-9012-3456'
            );

            // ASSERT 
            expect(pedido).toBeNull();
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(150, '1234-5678-9012-3456');
            expect(repositoryDummy.salvar).not.toHaveBeenCalled();
            expect(emailDummy.enviarEmail).not.toHaveBeenCalled();
        });
    });

    describe('quando um cliente Premium finaliza a compra', () => {
        it('deve aplicar desconto de 10% e enviar email de confirmação', async () => {
            // ARRANGE 
            const usuarioPremium = UserMother.umUsuarioPremium();
            
            const carrinho = new CarrinhoBuilder()
                .comUser(usuarioPremium)
                .comItens([
                    new Item('Notebook', 150),
                    new Item('Mouse', 50)
                ])
                .build();

            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ 
                    success: true 
                })
            };

            const repositoryStub = {
                salvar: jest.fn().mockResolvedValue({
                    id: 'PED-123',
                    carrinho: carrinho,
                    totalFinal: 180,
                    status: 'PROCESSADO'
                })
            };

            const emailMock = {
                enviarEmail: jest.fn().mockResolvedValue(true)
            };

            const checkoutService = new CheckoutService(
                gatewayStub,
                repositoryStub,
                emailMock
            );

            // ACT 
            const pedido = await checkoutService.processarPedido(
                carrinho,
                '1234-5678-9012-3456'
            );

            // ASSERT 
            
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(
                180, 
                '1234-5678-9012-3456'
            );

            expect(pedido).not.toBeNull();
            expect(pedido.id).toBe('PED-123');
            expect(pedido.status).toBe('PROCESSADO');

            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);

            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'premium@email.com',
                'Seu Pedido foi Aprovado!',
                'Pedido PED-123 no valor de R$180'
            );
        });
    });

    describe('quando um cliente padrão finaliza a compra', () => {
        it('deve processar sem desconto e enviar email', async () => {
            // ARRANGE
            const usuarioPadrao = UserMother.umUsuarioPadrao();
            
            const carrinho = new CarrinhoBuilder()
                .comUser(usuarioPadrao)
                .comValorTotal(100)
                .build();

            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: true })
            };

            const repositoryStub = {
                salvar: jest.fn().mockResolvedValue({
                    id: 'PED-456',
                    carrinho: carrinho,
                    totalFinal: 100,
                    status: 'PROCESSADO'
                })
            };

            const emailMock = {
                enviarEmail: jest.fn().mockResolvedValue(true)
            };

            const checkoutService = new CheckoutService(
                gatewayStub,
                repositoryStub,
                emailMock
            );

            // ACT
            const pedido = await checkoutService.processarPedido(
                carrinho,
                '1111-2222-3333-4444'
            );

            // ASSERT
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(100, '1111-2222-3333-4444');
            expect(pedido.totalFinal).toBe(100);
            
            expect(emailMock.enviarEmail).toHaveBeenCalledTimes(1);
            expect(emailMock.enviarEmail).toHaveBeenCalledWith(
                'joao@email.com',
                'Seu Pedido foi Aprovado!',
                'Pedido PED-456 no valor de R$100'
            );
        });
    });

    describe('quando o carrinho está vazio', () => {
        it('deve processar pedido com valor zero', async () => {
            // ARRANGE
            const carrinho = new CarrinhoBuilder()
                .vazio()
                .build();

            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: true })
            };

            const repositoryStub = {
                salvar: jest.fn().mockResolvedValue({
                    id: 'PED-789',
                    carrinho: carrinho,
                    totalFinal: 0,
                    status: 'PROCESSADO'
                })
            };

            const emailMock = {
                enviarEmail: jest.fn().mockResolvedValue(true)
            };

            const checkoutService = new CheckoutService(
                gatewayStub,
                repositoryStub,
                emailMock
            );

            // ACT
            const pedido = await checkoutService.processarPedido(
                carrinho,
                '9999-8888-7777-6666'
            );

            // ASSERT
            expect(gatewayStub.cobrar).toHaveBeenCalledWith(0, '9999-8888-7777-6666');
            expect(pedido).not.toBeNull();
            expect(pedido.totalFinal).toBe(0);
        });
    });

    describe('quando o envio de email falha', () => {
        it('não deve impedir o processamento do pedido', async () => {
            // ARRANGE
            const carrinho = new CarrinhoBuilder()
                .comValorTotal(50)
                .build();

            const gatewayStub = {
                cobrar: jest.fn().mockResolvedValue({ success: true })
            };

            const repositoryStub = {
                salvar: jest.fn().mockResolvedValue({
                    id: 'PED-999',
                    carrinho: carrinho,
                    totalFinal: 50,
                    status: 'PROCESSADO'
                })
            };

            const emailMock = {
                enviarEmail: jest.fn().mockRejectedValue(
                    new Error('Servidor SMTP indisponível')
                )
            };

            const checkoutService = new CheckoutService(
                gatewayStub,
                repositoryStub,
                emailMock
            );

            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

            // ACT
            const pedido = await checkoutService.processarPedido(
                carrinho,
                '5555-4444-3333-2222'
            );

            // ASSERT
            expect(pedido).not.toBeNull();
            expect(pedido.id).toBe('PED-999');
            expect(pedido.status).toBe('PROCESSADO');

            expect(consoleErrorSpy).toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        });
    });
});