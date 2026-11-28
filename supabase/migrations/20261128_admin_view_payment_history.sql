-- Permite que administradores vejam todos os pagamentos (aba Receita do painel admin).
-- Aplicada em produção em 28/11/2026 com aprovação do Kiel.
create policy "Admins can view all payments" on public.payment_history for select using (public.is_admin());
