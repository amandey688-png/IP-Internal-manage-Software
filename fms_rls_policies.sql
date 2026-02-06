-- ============================================================================
-- FMS SYSTEM - ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- Complete RLS policy implementation for all tables
-- Run this after creating the schema
-- ============================================================================

-- ============================================================================
-- 1. USERS TABLE POLICIES
-- ============================================================================

-- Users can read their own profile
DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Admins can read all users in their companies
DROP POLICY IF EXISTS users_select_company_admin ON public.users;
CREATE POLICY users_select_company_admin ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions ucd
            JOIN public.user_company_divisions ucd2 ON ucd2.company_id = ucd.company_id
            WHERE ucd2.user_id = auth.uid()
            AND ucd.user_id = users.id
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON r.id = ur.role_id
                WHERE ur.user_id = auth.uid()
                AND ur.is_active = TRUE
                AND r.name IN ('admin', 'master_admin')
            )
        )
    );

-- Users can update their own profile (except is_active)
DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND is_active = (SELECT is_active FROM public.users WHERE id = auth.uid())
    );

-- ============================================================================
-- 2. ROLES TABLE POLICIES
-- ============================================================================

-- All authenticated users can read roles
DROP POLICY IF EXISTS roles_select_all ON public.roles;
CREATE POLICY roles_select_all ON public.roles
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only master admins can modify roles
DROP POLICY IF EXISTS roles_modify_master_admin ON public.roles;
CREATE POLICY roles_modify_master_admin ON public.roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = TRUE
            AND r.name = 'master_admin'
        )
    );

-- ============================================================================
-- 3. PERMISSIONS TABLE POLICIES
-- ============================================================================

-- All authenticated users can read permissions
DROP POLICY IF EXISTS permissions_select_all ON public.permissions;
CREATE POLICY permissions_select_all ON public.permissions
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only master admins can modify permissions
DROP POLICY IF EXISTS permissions_modify_master_admin ON public.permissions;
CREATE POLICY permissions_modify_master_admin ON public.permissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = TRUE
            AND r.name = 'master_admin'
        )
    );

-- ============================================================================
-- 4. USER_ROLES TABLE POLICIES
-- ============================================================================

-- Users can read their own roles
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own ON public.user_roles
    FOR SELECT
    USING (user_id = auth.uid());

-- Admins can read roles of users in their companies
DROP POLICY IF EXISTS user_roles_select_company_admin ON public.user_roles;
CREATE POLICY user_roles_select_company_admin ON public.user_roles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions ucd
            JOIN public.user_company_divisions ucd2 ON ucd2.company_id = ucd.company_id
            WHERE ucd2.user_id = auth.uid()
            AND ucd.user_id = user_roles.user_id
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON r.id = ur.role_id
                WHERE ur.user_id = auth.uid()
                AND ur.is_active = TRUE
                AND r.name IN ('admin', 'master_admin')
            )
        )
    );

-- Only admins can assign roles
DROP POLICY IF EXISTS user_roles_modify_admin ON public.user_roles;
CREATE POLICY user_roles_modify_admin ON public.user_roles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = TRUE
            AND r.name IN ('admin', 'master_admin')
        )
    );

-- ============================================================================
-- 5. COMPANIES TABLE POLICIES
-- ============================================================================

-- Users can read companies they belong to
DROP POLICY IF EXISTS companies_select_member ON public.companies;
CREATE POLICY companies_select_member ON public.companies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = companies.id
        )
    );

-- Admins can read all companies
DROP POLICY IF EXISTS companies_select_admin ON public.companies;
CREATE POLICY companies_select_admin ON public.companies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = TRUE
            AND r.name IN ('admin', 'master_admin')
        )
    );

-- Only admins can create/update companies
DROP POLICY IF EXISTS companies_modify_admin ON public.companies;
CREATE POLICY companies_modify_admin ON public.companies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = TRUE
            AND r.name IN ('admin', 'master_admin')
        )
    );

-- ============================================================================
-- 6. DIVISIONS TABLE POLICIES
-- ============================================================================

-- Users can read divisions of their companies
DROP POLICY IF EXISTS divisions_select_company_member ON public.divisions;
CREATE POLICY divisions_select_company_member ON public.divisions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = divisions.company_id
        )
    );

-- Only admins can create/update divisions
DROP POLICY IF EXISTS divisions_modify_admin ON public.divisions;
CREATE POLICY divisions_modify_admin ON public.divisions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = divisions.company_id
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON r.id = ur.role_id
                WHERE ur.user_id = auth.uid()
                AND ur.is_active = TRUE
                AND r.name IN ('admin', 'master_admin')
            )
        )
    );

-- ============================================================================
-- 7. USER_COMPANY_DIVISIONS TABLE POLICIES
-- ============================================================================

-- Users can read their own company/division assignments
DROP POLICY IF EXISTS user_company_divisions_select_own ON public.user_company_divisions;
CREATE POLICY user_company_divisions_select_own ON public.user_company_divisions
    FOR SELECT
    USING (user_id = auth.uid());

-- Admins can read assignments in their companies
DROP POLICY IF EXISTS user_company_divisions_select_company_admin ON public.user_company_divisions;
CREATE POLICY user_company_divisions_select_company_admin ON public.user_company_divisions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions ucd2
            WHERE ucd2.user_id = auth.uid()
            AND ucd2.company_id = user_company_divisions.company_id
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON r.id = ur.role_id
                WHERE ur.user_id = auth.uid()
                AND ur.is_active = TRUE
                AND r.name IN ('admin', 'master_admin')
            )
        )
    );

-- Only admins can assign users to companies/divisions
DROP POLICY IF EXISTS user_company_divisions_modify_admin ON public.user_company_divisions;
CREATE POLICY user_company_divisions_modify_admin ON public.user_company_divisions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions ucd2
            WHERE ucd2.user_id = auth.uid()
            AND ucd2.company_id = user_company_divisions.company_id
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON r.id = ur.role_id
                WHERE ur.user_id = auth.uid()
                AND ur.is_active = TRUE
                AND r.name IN ('admin', 'master_admin')
            )
        )
    );

-- ============================================================================
-- 8. TICKETS TABLE POLICIES
-- ============================================================================

-- Users can read tickets from their companies/divisions
DROP POLICY IF EXISTS tickets_select_company_member ON public.tickets;
CREATE POLICY tickets_select_company_member ON public.tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = tickets.company_id
            AND (division_id = tickets.division_id OR tickets.division_id IS NULL)
        )
        OR created_by = auth.uid()
        OR assignee_id = auth.uid()
    );

-- Users can create tickets in their companies
DROP POLICY IF EXISTS tickets_insert_company_member ON public.tickets;
CREATE POLICY tickets_insert_company_member ON public.tickets
    FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = tickets.company_id
        )
    );

-- Assignees and creators can update tickets
DROP POLICY IF EXISTS tickets_update_assignee_creator ON public.tickets;
CREATE POLICY tickets_update_assignee_creator ON public.tickets
    FOR UPDATE
    USING (
        assignee_id = auth.uid()
        OR created_by = auth.uid()
    );

-- Admins can update any ticket in their companies
DROP POLICY IF EXISTS tickets_update_company_admin ON public.tickets;
CREATE POLICY tickets_update_company_admin ON public.tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = tickets.company_id
            AND EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON r.id = ur.role_id
                WHERE ur.user_id = auth.uid()
                AND ur.is_active = TRUE
                AND r.name IN ('admin', 'master_admin')
            )
        )
    );

-- Only admins can delete tickets
DROP POLICY IF EXISTS tickets_delete_admin ON public.tickets;
CREATE POLICY tickets_delete_admin ON public.tickets
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = TRUE
            AND r.name IN ('admin', 'master_admin')
        )
    );

-- ============================================================================
-- 9. TICKET_ATTACHMENTS TABLE POLICIES
-- ============================================================================

-- Users can read attachments for accessible tickets
DROP POLICY IF EXISTS ticket_attachments_select_accessible ON public.ticket_attachments;
CREATE POLICY ticket_attachments_select_accessible ON public.ticket_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = ticket_attachments.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- Users can upload attachments to accessible tickets
DROP POLICY IF EXISTS ticket_attachments_insert_accessible ON public.ticket_attachments;
CREATE POLICY ticket_attachments_insert_accessible ON public.ticket_attachments
    FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = ticket_attachments.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- Users can delete their own attachments
DROP POLICY IF EXISTS ticket_attachments_delete_own ON public.ticket_attachments;
CREATE POLICY ticket_attachments_delete_own ON public.ticket_attachments
    FOR DELETE
    USING (uploaded_by = auth.uid());

-- ============================================================================
-- 10. TICKET_COMMENTS TABLE POLICIES
-- ============================================================================

-- Users can read comments for accessible tickets
DROP POLICY IF EXISTS ticket_comments_select_accessible ON public.ticket_comments;
CREATE POLICY ticket_comments_select_accessible ON public.ticket_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = ticket_comments.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
        AND (
            NOT is_internal
            OR EXISTS (
                SELECT 1 FROM public.user_roles ur
                JOIN public.roles r ON r.id = ur.role_id
                WHERE ur.user_id = auth.uid()
                AND ur.is_active = TRUE
                AND r.name IN ('admin', 'master_admin')
            )
            OR EXISTS (
                SELECT 1 FROM public.tickets
                WHERE id = ticket_comments.ticket_id
                AND assignee_id = auth.uid()
            )
        )
    );

-- Users can create comments on accessible tickets
DROP POLICY IF EXISTS ticket_comments_insert_accessible ON public.ticket_comments;
CREATE POLICY ticket_comments_insert_accessible ON public.ticket_comments
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = ticket_comments.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- Users can update/delete their own comments
DROP POLICY IF EXISTS ticket_comments_modify_own ON public.ticket_comments;
CREATE POLICY ticket_comments_modify_own ON public.ticket_comments
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS ticket_comments_delete_own ON public.ticket_comments;
CREATE POLICY ticket_comments_delete_own ON public.ticket_comments
    FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================================
-- 11. TICKET_HISTORY TABLE POLICIES
-- ============================================================================

-- Users can read history for accessible tickets
DROP POLICY IF EXISTS ticket_history_select_accessible ON public.ticket_history;
CREATE POLICY ticket_history_select_accessible ON public.ticket_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = ticket_history.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- System only (no user insert policy - use service role)

-- ============================================================================
-- 12. FEATURE_APPROVALS TABLE POLICIES
-- ============================================================================

-- Users can read approvals for accessible tickets
DROP POLICY IF EXISTS feature_approvals_select_accessible ON public.feature_approvals;
CREATE POLICY feature_approvals_select_accessible ON public.feature_approvals
    FOR SELECT
    USING (
        requested_by = auth.uid()
        OR approver_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = feature_approvals.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- Users can create approval requests for their feature tickets
DROP POLICY IF EXISTS feature_approvals_insert_own_features ON public.feature_approvals;
CREATE POLICY feature_approvals_insert_own_features ON public.feature_approvals
    FOR INSERT
    WITH CHECK (
        requested_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = feature_approvals.ticket_id
            AND created_by = auth.uid()
            AND type = 'feature'
        )
    );

-- Approvers can update approvals assigned to them
DROP POLICY IF EXISTS feature_approvals_update_approver ON public.feature_approvals;
CREATE POLICY feature_approvals_update_approver ON public.feature_approvals
    FOR UPDATE
    USING (approver_id = auth.uid())
    WITH CHECK (approver_id = auth.uid());

-- ============================================================================
-- 13. SOLUTIONS TABLE POLICIES
-- ============================================================================

-- Users can read solutions for accessible tickets
DROP POLICY IF EXISTS solutions_select_accessible ON public.solutions;
CREATE POLICY solutions_select_accessible ON public.solutions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = solutions.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- Users can create solutions for accessible tickets
DROP POLICY IF EXISTS solutions_insert_accessible ON public.solutions;
CREATE POLICY solutions_insert_accessible ON public.solutions
    FOR INSERT
    WITH CHECK (
        proposed_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = solutions.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- Users can update solutions they proposed or admins can update any
DROP POLICY IF EXISTS solutions_update_own_admin ON public.solutions;
CREATE POLICY solutions_update_own_admin ON public.solutions
    FOR UPDATE
    USING (
        proposed_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = solutions.ticket_id
            AND EXISTS (
                SELECT 1 FROM public.user_company_divisions
                WHERE user_id = auth.uid()
                AND company_id = tickets.company_id
                AND EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    JOIN public.roles r ON r.id = ur.role_id
                    WHERE ur.user_id = auth.uid()
                    AND ur.is_active = TRUE
                    AND r.name IN ('admin', 'master_admin')
                )
            )
        )
    );

-- ============================================================================
-- 14. SLA_RULES TABLE POLICIES
-- ============================================================================

-- All authenticated users can read active SLA rules
DROP POLICY IF EXISTS sla_rules_select_active ON public.sla_rules;
CREATE POLICY sla_rules_select_active ON public.sla_rules
    FOR SELECT
    USING (is_active = TRUE AND auth.uid() IS NOT NULL);

-- Admins can read all SLA rules
DROP POLICY IF EXISTS sla_rules_select_admin ON public.sla_rules;
CREATE POLICY sla_rules_select_admin ON public.sla_rules
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = TRUE
            AND r.name IN ('admin', 'master_admin')
        )
    );

-- Only admins can create/update SLA rules
DROP POLICY IF EXISTS sla_rules_modify_admin ON public.sla_rules;
CREATE POLICY sla_rules_modify_admin ON public.sla_rules
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = TRUE
            AND r.name IN ('admin', 'master_admin')
        )
    );

-- ============================================================================
-- 15. SLA_TRACKING TABLE POLICIES
-- ============================================================================

-- Users can read SLA tracking for accessible tickets
DROP POLICY IF EXISTS sla_tracking_select_accessible ON public.sla_tracking;
CREATE POLICY sla_tracking_select_accessible ON public.sla_tracking
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = sla_tracking.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- System only (no user insert/update policy - use service role)

-- ============================================================================
-- 16. SLA_BREACHES TABLE POLICIES
-- ============================================================================

-- Users can read breaches for accessible tickets
DROP POLICY IF EXISTS sla_breaches_select_accessible ON public.sla_breaches;
CREATE POLICY sla_breaches_select_accessible ON public.sla_breaches
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = sla_breaches.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- System only (no user insert policy - use service role)

-- ============================================================================
-- 17. STAGING_TICKETS TABLE POLICIES
-- ============================================================================

-- Users can read staging tickets for accessible tickets
DROP POLICY IF EXISTS staging_tickets_select_accessible ON public.staging_tickets;
CREATE POLICY staging_tickets_select_accessible ON public.staging_tickets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = staging_tickets.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- Users can create staging tickets for accessible tickets
DROP POLICY IF EXISTS staging_tickets_insert_accessible ON public.staging_tickets;
CREATE POLICY staging_tickets_insert_accessible ON public.staging_tickets
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = staging_tickets.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- Admins can update staging tickets
DROP POLICY IF EXISTS staging_tickets_update_admin ON public.staging_tickets;
CREATE POLICY staging_tickets_update_admin ON public.staging_tickets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = staging_tickets.ticket_id
            AND EXISTS (
                SELECT 1 FROM public.user_company_divisions
                WHERE user_id = auth.uid()
                AND company_id = tickets.company_id
                AND EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    JOIN public.roles r ON r.id = ur.role_id
                    WHERE ur.user_id = auth.uid()
                    AND ur.is_active = TRUE
                    AND r.name IN ('admin', 'master_admin')
                )
            )
        )
    );

-- ============================================================================
-- 18. SOLUTION_QUALITY TABLE POLICIES
-- ============================================================================

-- Users can read quality assessments for accessible tickets
DROP POLICY IF EXISTS solution_quality_select_accessible ON public.solution_quality;
CREATE POLICY solution_quality_select_accessible ON public.solution_quality
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = solution_quality.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- Users can create quality assessments for accessible tickets
DROP POLICY IF EXISTS solution_quality_insert_accessible ON public.solution_quality;
CREATE POLICY solution_quality_insert_accessible ON public.solution_quality
    FOR INSERT
    WITH CHECK (
        evaluated_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.tickets
            WHERE id = solution_quality.ticket_id
            AND (
                EXISTS (
                    SELECT 1 FROM public.user_company_divisions
                    WHERE user_id = auth.uid()
                    AND company_id = tickets.company_id
                )
                OR created_by = auth.uid()
                OR assignee_id = auth.uid()
            )
        )
    );

-- Users can update their own quality assessments
DROP POLICY IF EXISTS solution_quality_update_own ON public.solution_quality;
CREATE POLICY solution_quality_update_own ON public.solution_quality
    FOR UPDATE
    USING (evaluated_by = auth.uid())
    WITH CHECK (evaluated_by = auth.uid());

-- ============================================================================
-- 19. DASHBOARD_AGGREGATES TABLE POLICIES
-- ============================================================================

-- Users can read aggregates for their companies
DROP POLICY IF EXISTS dashboard_aggregates_select_company ON public.dashboard_aggregates;
CREATE POLICY dashboard_aggregates_select_company ON public.dashboard_aggregates
    FOR SELECT
    USING (
        company_id IS NULL -- Global aggregates
        OR EXISTS (
            SELECT 1 FROM public.user_company_divisions
            WHERE user_id = auth.uid()
            AND company_id = dashboard_aggregates.company_id
        )
    );

-- System only (no user insert policy - use service role for aggregation jobs)

-- ============================================================================
-- RLS POLICIES COMPLETE
-- ============================================================================
