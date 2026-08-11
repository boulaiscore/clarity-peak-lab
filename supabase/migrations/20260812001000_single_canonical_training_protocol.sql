-- LOOMA now exposes one canonical adaptive training protocol.
-- Normalize historical selections and make the balanced protocol the default
-- for every new profile. Application code also ignores legacy values so this
-- migration can roll out independently without creating mixed targets.
update public.profiles
set training_plan = 'expert'
where training_plan is distinct from 'expert';

alter table public.profiles
alter column training_plan set default 'expert';
